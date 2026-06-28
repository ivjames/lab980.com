# Task: Land the anti-abuse pass for Pillow Polygons

> Paste this as the opening prompt of a Claude Code session **scoped to the Pillow
> Poly repo** (the Flask app whose entry point is `app.py`, with `renderer.py`).
> Most of the code is already written and tested out-of-band (see "Artifacts"
> below) — your job is to land it against the real repo, then do the deploy
> wiring that can only happen on the droplet.

## Context: what this app is

A Flask app. `POST /api/generate` sends a user prompt to Claude, which returns a
string of Python "scene code"; `renderer.render()` **executes** that code with
Pillow to draw an image. So prompt-injection → code execution is the core risk,
alongside cost/upload/spam. The owner asked for: rate limiting, upload abuse,
spam/bot, NSFW/illegal warnings — and during the work the scope expanded to
hardening the scene-code execution itself.

## Artifacts (already written + tested, drop them in)

These files were produced and tested against the real `renderer.py` (benign
renders pass; import / dunder / `open` / generator-frame-walk / coroutine-frame /
`str.format`-walk / CPU-bomb / memory-bomb all blocked). Apply them, then review:

- **`app.py`** — rate limiting, text-only (uploads removed), input clamping, token
  cost, sandboxed render call. Replaces the current file.
- **`sandbox.py`** — NEW. Subprocess isolation with rlimits + wall-clock + secret-
  stripped env + `SANDBOX_WRAP` OS-jail hook.
- **`renderer.py`** — PATCH to `validate_scene` only (adds frame/generator/
  coroutine introspection attrs + `format`/`format_map` to the denylist). Keep the
  rest of the file as-is. **Review this diff carefully — it's the security fix.**
- **`deploy/pillowpoly.service`** — sample systemd unit (dedicated user + bwrap).
- **`README_ANTIABUSE.md`** — the README section to merge into the project README.

## What's DONE in those artifacts

1. **Rate limiting** — in-memory sliding window on `/api/generate`, default **3/min,
   30/day** per IP (`GENERATE_RATE_PER_MIN` / `GENERATE_RATE_PER_DAY`). `429` +
   `Retry-After`. IP from `remote_addr`; `X-Forwarded-For` only when `TRUST_PROXY=1`.
   *Caveat: in-memory = per-process. Single gunicorn worker, or move to Redis.*
2. **Upload abuse → removed** — the API is text-only. `call_claude` is text-only,
   the `ref` file handling is gone, `MAX_CONTENT_LENGTH` is 1MB. **Frontend TODO:
   remove the file `<input>` and any `ref` FormData append from `templates/` (not
   in the artifacts — you have the template, I didn't).**
3. **Input clamping** — `width`/`height` → 256–2048, `seed` → valid int, via
   `safe_int`. Kills `width=999999` DoS and `seed=abc` 500s.
4. **Token cost** — `PRICING` table + `compute_cost`; every image stores `model`
   (auto-migrated column) and reports `cost_usd` in the generate response and the
   gallery list. **Frontend TODO: render `cost_usd`.**
5. **Scene-code sandbox, Layer A** — `renderer.validate_scene` (AST allowlist) +
   `SAFE_BUILTINS`. Now also blocks the frame-introspection RCE (`gi_frame.f_back.
   f_globals['os']` and friends) and `str.format` template walks.
6. **Scene-code sandbox, Layer B** — `sandbox.run_sandboxed` runs the render in a
   subprocess with CPU/mem/output rlimits, a wall-clock kill, a decompression-bomb
   guard, and an env stripped of `ANTHROPIC_API_KEY`.
7. **Robustness** — tag/folder routes use `get_json(silent=True)` (no 500 on bad
   body); JSON-key/SQL handling unchanged (already parameterized).

## What YOU need to do — the five hardening recommendations

The in-language allowlist is a **speed bump, not a boundary** (CPython introspection
is bypassable in principle; one bypass class was already found and fixed). The OS
jail is the control that actually holds. These are mostly droplet-side:

### Rec 1 — Make Layer B the real boundary: set `SANDBOX_WRAP` [BLOCKS public deploy]
- Install bubblewrap on the droplet (`apt-get install bubblewrap`).
- Set `SANDBOX_WRAP` (see `deploy/pillowpoly.service`) to a `bwrap --unshare-all
  --die-with-parent --ro-bind / / --tmpfs /tmp --proc /proc --dev /dev --bind
  <RENDERS_DIR> <RENDERS_DIR>` invocation. With it empty, the worker is NOT
  network/FS-isolated — fine only for trusted single-user local use.
- **Test on the droplet**: confirm a benign generate still renders under bwrap, and
  that `unprivileged_userns_clone` is enabled (`sysctl kernel.unprivileged_userns_clone`;
  set to 1 if needed). bwrap can't be tested in this authoring environment.

### Rec 2 — Network isolation specifically [BLOCKS public deploy]
- `--unshare-all` already includes `--unshare-net` → no egress. Verify inside the
  jail there's no route out (a full Layer-A bypass must not be able to `curl` data
  out). This is the single most important step: it neutralizes exfil regardless of
  what Python an attacker reaches.

### Rec 3 — Dedicated unprivileged UID
- Create a `pillowpoly` system user; `chown -R` the app dir to it; run the service
  as `User=pillowpoly` (unit does this).
- Tighten perms so the worker can't read what it doesn't need: `chmod 600 poly.db`,
  keep source non-world-readable. NOTE: the worker is spawned by the app process and
  shares its UID, so it can still read `poly.db` (the app's own data — acceptable for
  a single-user app). If you want the worker to be unable to read the DB/source even
  on a full escape, run the worker pool under a **separate** service user via a
  setuid helper or a second unit — document as an advanced step; don't block on it.

### Rec 4 — `str.format` / `Image.open` residuals [DONE — verify]
- `format`/`format_map` are now denied in `validate_scene`. `Image.open` file reads
  are reachable but contained by `MAX_IMAGE_PIXELS` + the read-only bwrap FS.
- Verify: re-run the test battery in "Verification" below after applying the diff.

### Rec 5 — Document the stronger-jail end state [docs only]
- Add a note (README or an ADR) that if Pillow Poly takes real public traffic, the
  next step beyond bwrap is a syscall-filtered / VM jail (nsjail with a seccomp
  profile, gVisor, or a Firecracker microVM) so a kernel-level escape is also
  contained. Not needed now — record it so the decision is explicit.

## Pinned (do NOT build this pass)

- **Honeypot + form-timing bot defense on `/api/generate`.** Owner explicitly
  pinned it. Rate limiting is the bot defense for now. Leave a `# TODO(anti-abuse):
  honeypot field + signed form-timing token` marker near the generate handler so
  it's easy to pick up, and stop there.

## Deferred (separate pass, with owner sign-off)

- **NSFW / illegal-content moderation** of prompt and/or output. Out of scope here.
  When it happens: a keyword denylist for clearly-illegal categories + an optional
  Claude-vision/text moderation pass behind a flag, plus a user-facing warning/ack
  gate. Be honest in comments that this is not real CSAM detection (PhotoDNA/CSAI
  match is the proper path) — don't fake it.

## Verification (run after applying the artifacts)

In the repo with Pillow installed:
- Benign scene renders; these are all rejected: `import os`; `().__class__.
  __bases__[0].__subclasses__()`; `open('/etc/passwd')`; the running-generator walk
  `g=(...);next;gen.send(gen)` reaching `f_globals['os']`; an `async def` coroutine's
  `cr_frame`; `'{0.__class__}'.format(draw)`; a `while True` CPU spin (killed by
  `RLIMIT_CPU`); an unbounded `bytearray` grow (killed by `RLIMIT_AS`).
- 4+ rapid `/api/generate` from one IP → `429` + `Retry-After`.
- `width=999999` / `seed=abc` no longer 500 (clamped).
- A generation returns `cost_usd`; the gallery list includes it.
- On the droplet only: a benign generate renders with `SANDBOX_WRAP` set, and a
  payload that reaches real `os` (if any new bypass exists) cannot open a network
  socket out of the jail.

## New env vars to document

`TRUST_PROXY`, `GENERATE_RATE_PER_MIN`, `GENERATE_RATE_PER_DAY`, `SANDBOX_CPU_SECONDS`,
`SANDBOX_MEM_MB`, `SANDBOX_FSIZE_MB`, `SANDBOX_WALL_SECONDS`, `SANDBOX_MAX_IMAGE_PIXELS`,
`SANDBOX_WRAP`. All are in `README_ANTIABUSE.md`.
