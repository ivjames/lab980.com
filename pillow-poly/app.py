import os, json, sqlite3, uuid, sys, time, threading
from functools import wraps
from collections import defaultdict, deque
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, render_template, g
from PIL import Image as PILImage
import anthropic

# ── paths ──────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
RENDERS_DIR = os.path.join(BASE_DIR, "static", "renders")
DB_PATH     = os.path.join(BASE_DIR, "poly.db")
RENDERER    = os.path.join(BASE_DIR, "renderer.py")

os.makedirs(RENDERS_DIR, exist_ok=True)

# inject renderer into path
sys.path.insert(0, BASE_DIR)
from renderer import validate_scene          # static AST allowlist (Part A)
from sandbox import run_sandboxed, SandboxError  # subprocess + rlimits (Part B)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024  # 1MB — text-only API, no uploads

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# ── pricing (USD per 1,000,000 tokens: input, output) ──────────────────────
PRICING = {
    "claude-fable-5":    (10.00, 50.00),
    "claude-opus-4-8":   ( 5.00, 25.00),
    "claude-opus-4-7":   ( 5.00, 25.00),
    "claude-opus-4-6":   ( 5.00, 25.00),
    "claude-sonnet-4-6": ( 3.00, 15.00),
    "claude-haiku-4-5":  ( 1.00,  5.00),
}
DEFAULT_MODEL = "claude-sonnet-4-6"

def compute_cost(model, tokens_in, tokens_out):
    rate_in, rate_out = PRICING.get(model, PRICING[DEFAULT_MODEL])
    cost = (tokens_in or 0) / 1_000_000 * rate_in + (tokens_out or 0) / 1_000_000 * rate_out
    return round(cost, 4)

# ── rate limiting (in-memory sliding window) ───────────────────────────────
# NOTE: in-memory state is per-process. If you run more than one gunicorn/uwsgi
# worker, limits are enforced per-worker, not globally. Back this with Redis
# (or flask-limiter + Redis) if you scale past a single process.
_rl_lock = threading.Lock()
_rl_hits = defaultdict(deque)  # key -> deque[timestamps]

def _client_ip():
    # Only trust X-Forwarded-For behind a reverse proxy you control, else clients
    # spoof it to bypass limits. Opt in with TRUST_PROXY=1.
    if os.environ.get("TRUST_PROXY") == "1":
        xff = request.headers.get("X-Forwarded-For", "")
        if xff:
            return xff.split(",")[0].strip()
    return request.remote_addr or "unknown"

def rate_limit(limit, window):
    """Allow `limit` requests per `window` seconds per (route, client IP)."""
    def deco(fn):
        @wraps(fn)
        def wrapper(*a, **k):
            key = f"{fn.__name__}:{_client_ip()}"
            now = time.time()
            with _rl_lock:
                dq = _rl_hits[key]
                while dq and dq[0] <= now - window:
                    dq.popleft()
                if len(dq) >= limit:
                    retry = int(window - (now - dq[0])) + 1
                    resp = jsonify({"error": f"Rate limit exceeded. Try again in {retry}s."})
                    resp.status_code = 429
                    resp.headers["Retry-After"] = str(retry)
                    return resp
                dq.append(now)
            return fn(*a, **k)
        return wrapper
    return deco

# env-tunable limits for the expensive generate endpoint
GEN_PER_MIN = int(os.environ.get("GENERATE_RATE_PER_MIN", "3"))
GEN_PER_DAY = int(os.environ.get("GENERATE_RATE_PER_DAY", "30"))

def safe_int(value, default, lo, hi):
    try:
        return max(lo, min(hi, int(value)))
    except (TypeError, ValueError):
        return default

# ── DB ─────────────────────────────────────────────────────────────────────
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop("db", None)
    if db: db.close()

def init_db():
    with sqlite3.connect(DB_PATH) as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS images (
            id          TEXT PRIMARY KEY,
            filename    TEXT NOT NULL,
            thumb       TEXT,
            prompt      TEXT,
            preset      TEXT,
            seed        INTEGER,
            width       INTEGER,
            height      INTEGER,
            model       TEXT,
            tokens_in   INTEGER DEFAULT 0,
            tokens_out  INTEGER DEFAULT 0,
            scene_code  TEXT,
            created_at  TEXT
        );
        CREATE TABLE IF NOT EXISTS folders (
            id   TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS tags (
            id   TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS image_folders (
            image_id  TEXT,
            folder_id TEXT,
            PRIMARY KEY (image_id, folder_id)
        );
        CREATE TABLE IF NOT EXISTS image_tags (
            image_id TEXT,
            tag_id   TEXT,
            PRIMARY KEY (image_id, tag_id)
        );
        """)
        # migration: add `model` to pre-existing DBs that lack it
        cols = [r[1] for r in db.execute("PRAGMA table_info(images)").fetchall()]
        if "model" not in cols:
            db.execute("ALTER TABLE images ADD COLUMN model TEXT")
    print("DB initialised")

init_db()

# ── helpers ────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are the Pillow Polygons scene code generator.

Given a user prompt, output ONLY a Python code string — no markdown, no backticks, no explanation. Just raw Python drawing instructions.

The following are pre-injected and available without importing:
  img, draw, W, H, rng, palette,
  Image, ImageDraw, ImageFont, math, random

Rules:
- Use rng (not random) for all randomness
- After every alpha_composite, re-acquire draw:
    img = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")
    draw = ImageDraw.Draw(img)
- Always end with a vignette:
    vig = Image.new("RGBA",(W,H),(0,0,0,0))
    vd = ImageDraw.Draw(vig)
    for r in range(0,min(W,H)//2,10):
        a = int(85*(r/(min(W,H)//2)))
        vd.rectangle([r,r,W-r,H-r], outline=(0,0,0,a), width=10)
    img = Image.alpha_composite(img.convert("RGBA"),vig).convert("RGB")
    draw = ImageDraw.Draw(img)
- Use gradient backgrounds (scan line by line)
- Build characters from polygons and ellipses with shadow/base/highlight layers
- Eyes need socket → iris → pupil → gleam

Available presets inject palette dict with keys: bg, atmosphere, accent, grain
Always use palette.get('bg', (20,20,30)) style access — palette may be empty if no preset selected.
Available fonts (use try/except):
  /usr/share/fonts/truetype/google-fonts/Poppins-Light.ttf
  /usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf
  /usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf

Output raw Python only. Nothing else."""

def call_claude(prompt, preset=None, seed=42, model=DEFAULT_MODEL):
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    preset_note = f"\nActive preset: {preset}" if preset else ""
    seed_note   = f"\nSeed: {seed}"
    user_content = [{
        "type": "text",
        "text": f"{prompt}{preset_note}{seed_note}"
    }]

    response = client.messages.create(
        model=model,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}]
    )

    scene_code = response.content[0].text.strip()
    tokens_in  = response.usage.input_tokens
    tokens_out = response.usage.output_tokens

    return scene_code, tokens_in, tokens_out

def row_to_dict(row):
    d = dict(row)
    db = get_db()
    img_id = d["id"]
    d["tags"] = [r["name"] for r in db.execute(
        "SELECT t.name FROM tags t JOIN image_tags it ON t.id=it.tag_id WHERE it.image_id=?", (img_id,)
    ).fetchall()]
    d["folders"] = [r["name"] for r in db.execute(
        "SELECT f.name FROM folders f JOIN image_folders if2 ON f.id=if2.folder_id WHERE if2.image_id=?", (img_id,)
    ).fetchall()]
    d["cost_usd"] = compute_cost(d.get("model"), d.get("tokens_in"), d.get("tokens_out"))
    return d

# ── routes: pages ──────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")

# ── routes: generation ─────────────────────────────────────────────────────
@app.route("/api/generate", methods=["POST"])
@rate_limit(GEN_PER_MIN, 60)
@rate_limit(GEN_PER_DAY, 86400)
def generate():
    prompt  = request.form.get("prompt", "").strip()
    preset  = request.form.get("preset") or None
    seed    = safe_int(request.form.get("seed"),   42, 0, 2**31 - 1)
    width   = safe_int(request.form.get("width"), 1024, 256, 2048)
    height  = safe_int(request.form.get("height"), 1024, 256, 2048)

    if not prompt:
        return jsonify({"error": "Prompt required"}), 400

    model = request.form.get("model", DEFAULT_MODEL)
    if model not in PRICING:
        model = DEFAULT_MODEL

    try:
        scene_code, tokens_in, tokens_out = call_claude(prompt, preset, seed, model)
    except Exception as e:
        return jsonify({"error": f"Claude API error: {e}"}), 500

    # validate — covers syntax AND the sandbox policy (no imports, no dunder
    # access, no denied builtins). Retry once if Claude emitted bad/forbidden code.
    scene_err = validate_scene(scene_code)
    if scene_err:
        try:
            fix_prompt = f"The following Python scene code was rejected: {scene_err}\n\nFix it and return only the corrected code, no explanation. Do not use imports, underscore/dunder attributes, eval/exec/open, or any builtins outside basic math and drawing:\n\n{scene_code}"
            scene_code, tokens_in2, tokens_out2 = call_claude(fix_prompt, preset, seed, model)
            tokens_in  += tokens_in2
            tokens_out += tokens_out2
        except Exception as e:
            return jsonify({"error": f"Scene rejected and fix failed: {scene_err}"}), 500
        scene_err2 = validate_scene(scene_code)
        if scene_err2:
            return jsonify({"error": f"Scene rejected after retry: {scene_err2}", "scene_code": scene_code}), 500

    # render — in an isolated subprocess with CPU/memory/output/wall-clock caps.
    # validate_scene runs again inside the sandbox as defense-in-depth.
    img_id   = uuid.uuid4().hex
    filename = f"{img_id}.png"

    try:
        result = run_sandboxed(
            scene_code, filename=filename,
            width=width, height=height, seed=seed,
            preset=preset, thumbnail=True,
            output_dir=RENDERS_DIR
        )
    except SandboxError as e:
        return jsonify({"error": f"Render error: {e}", "scene_code": scene_code}), 500

    thumb_name = os.path.basename(result["thumb"]) if result.get("thumb") else None
    svg_name   = os.path.basename(result["svg"])   if result.get("svg")   else None

    created_at = datetime.utcnow().isoformat() + "Z"
    db = get_db()
    db.execute("""
        INSERT INTO images (id, filename, thumb, prompt, preset, seed, width, height,
                            model, tokens_in, tokens_out, scene_code, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (img_id, filename, thumb_name, prompt, preset, seed, width, height,
          model, tokens_in, tokens_out, scene_code, created_at))
    db.commit()

    row = db.execute("SELECT * FROM images WHERE id=?", (img_id,)).fetchone()
    return jsonify({**row_to_dict(row),
                    "url":       f"/static/renders/{filename}",
                    "thumb_url": f"/static/renders/{thumb_name}" if thumb_name else None,
                    "svg_url":   f"/static/renders/{svg_name}"   if svg_name   else None})

# ── routes: images ─────────────────────────────────────────────────────────
@app.route("/api/images")
def list_images():
    db     = get_db()
    q      = request.args.get("q", "").strip()
    folder = request.args.get("folder", "").strip()
    tag    = request.args.get("tag", "").strip()

    sql    = "SELECT DISTINCT i.* FROM images i"
    joins  = []
    wheres = []
    params = []

    if folder:
        joins.append("JOIN image_folders if2 ON i.id=if2.image_id JOIN folders f ON f.id=if2.folder_id")
        wheres.append("f.name=?"); params.append(folder)
    if tag:
        joins.append("JOIN image_tags it ON i.id=it.image_id JOIN tags t ON t.id=it.tag_id")
        wheres.append("t.name=?"); params.append(tag)
    if q:
        wheres.append("i.prompt LIKE ?"); params.append(f"%{q}%")

    if joins:  sql += " " + " ".join(joins)
    if wheres: sql += " WHERE " + " AND ".join(wheres)
    sql += " ORDER BY i.created_at DESC"

    rows = db.execute(sql, params).fetchall()
    return jsonify([{**row_to_dict(r),
                     "url": f"/static/renders/{r['filename']}",
                     "thumb_url": f"/static/renders/{r['thumb']}"} for r in rows])

@app.route("/api/images/<img_id>", methods=["DELETE"])
def delete_image(img_id):
    db  = get_db()
    row = db.execute("SELECT * FROM images WHERE id=?", (img_id,)).fetchone()
    if not row: return jsonify({"error": "Not found"}), 404
    for f in [row["filename"], row["thumb"]]:
        p = os.path.join(RENDERS_DIR, f)
        if f and os.path.exists(p): os.remove(p)
    db.execute("DELETE FROM image_tags WHERE image_id=?",   (img_id,))
    db.execute("DELETE FROM image_folders WHERE image_id=?", (img_id,))
    db.execute("DELETE FROM images WHERE id=?",             (img_id,))
    db.commit()
    return jsonify({"ok": True})

@app.route("/api/images/<img_id>/tags", methods=["POST"])
def add_tag(img_id):
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip().lower()
    if not name: return jsonify({"error": "Name required"}), 400
    db = get_db()
    existing = db.execute("SELECT id FROM tags WHERE name=?", (name,)).fetchone()
    tag_id   = existing["id"] if existing else uuid.uuid4().hex
    if not existing:
        db.execute("INSERT INTO tags (id,name) VALUES (?,?)", (tag_id, name))
    try:
        db.execute("INSERT INTO image_tags (image_id,tag_id) VALUES (?,?)", (img_id, tag_id))
    except sqlite3.IntegrityError:
        pass
    db.commit()
    return jsonify({"ok": True, "tag": name})

@app.route("/api/images/<img_id>/tags/<tag_name>", methods=["DELETE"])
def remove_tag(img_id, tag_name):
    db     = get_db()
    tag    = db.execute("SELECT id FROM tags WHERE name=?", (tag_name,)).fetchone()
    if tag:
        db.execute("DELETE FROM image_tags WHERE image_id=? AND tag_id=?", (img_id, tag["id"]))
        db.commit()
    return jsonify({"ok": True})

@app.route("/api/images/<img_id>/folders", methods=["POST"])
def add_to_folder(img_id):
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    if not name: return jsonify({"error": "Name required"}), 400
    db = get_db()
    existing  = db.execute("SELECT id FROM folders WHERE name=?", (name,)).fetchone()
    folder_id = existing["id"] if existing else uuid.uuid4().hex
    if not existing:
        db.execute("INSERT INTO folders (id,name) VALUES (?,?)", (folder_id, name))
    try:
        db.execute("INSERT INTO image_folders (image_id,folder_id) VALUES (?,?)", (img_id, folder_id))
    except sqlite3.IntegrityError:
        pass
    db.commit()
    return jsonify({"ok": True, "folder": name})

@app.route("/api/images/<img_id>/folders/<folder_name>", methods=["DELETE"])
def remove_from_folder(img_id, folder_name):
    db = get_db()
    f  = db.execute("SELECT id FROM folders WHERE name=?", (folder_name,)).fetchone()
    if f:
        db.execute("DELETE FROM image_folders WHERE image_id=? AND folder_id=?", (img_id, f["id"]))
        db.commit()
    return jsonify({"ok": True})

# ── routes: folders & tags ─────────────────────────────────────────────────
@app.route("/api/folders")
def list_folders():
    db = get_db()
    rows = db.execute("""
        SELECT f.name, COUNT(if2.image_id) as count
        FROM folders f LEFT JOIN image_folders if2 ON f.id=if2.folder_id
        GROUP BY f.id ORDER BY f.name
    """).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/folders", methods=["POST"])
def create_folder():
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    if not name: return jsonify({"error": "Name required"}), 400
    db = get_db()
    existing = db.execute("SELECT id FROM folders WHERE name=?", (name,)).fetchone()
    if existing: return jsonify({"error": "Folder exists"}), 409
    fid = uuid.uuid4().hex
    db.execute("INSERT INTO folders (id,name) VALUES (?,?)", (fid, name))
    db.commit()
    return jsonify({"ok": True, "id": fid, "name": name})

@app.route("/api/folders/<name>", methods=["DELETE"])
def delete_folder(name):
    db = get_db()
    f  = db.execute("SELECT id FROM folders WHERE name=?", (name,)).fetchone()
    if f:
        db.execute("DELETE FROM image_folders WHERE folder_id=?", (f["id"],))
        db.execute("DELETE FROM folders WHERE id=?", (f["id"],))
        db.commit()
    return jsonify({"ok": True})

@app.route("/api/tags")
def list_tags():
    db   = get_db()
    rows = db.execute("""
        SELECT t.name, COUNT(it.image_id) as count
        FROM tags t LEFT JOIN image_tags it ON t.id=it.tag_id
        GROUP BY t.id ORDER BY count DESC, t.name
    """).fetchall()
    return jsonify([dict(r) for r in rows])

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8040, debug=False)
