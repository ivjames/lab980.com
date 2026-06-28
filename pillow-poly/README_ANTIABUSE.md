# Anti-abuse & sandboxing

Pillow Polygons turns a user prompt into Python "scene code" (via Claude) and
**executes** it to draw the image. That makes prompt-injection → code execution
the core risk, alongside the usual cost/upload/spam concerns. This section
documents the controls and how to configure them.

## What's protected

| Area | Control |
|---|---|
| **Cost abuse** | Per-IP rate limiting on `/api/generate` (the only endpoint that calls the Claude API). |
| **Executed scene code** | Two-layer sandbox: a static AST allowlist (`renderer.validate_scene`) + a subprocess with resource limits (`sandbox.run_sandboxed`). |
| **Upload abuse** | Removed — the API is text-only. No file is accepted or written. |
| **Resource DoS** | `width`/`height`/`seed` are clamped; renders run under CPU/memory/output/wall-clock caps. |
| **Cost visibility** | Each generation records its model and reports `cost_usd` from token usage. |

## Rate limiting

In-memory sliding window, keyed by `(route, client IP)`. Defaults are deliberately
tight because every call costs Claude API tokens.

| Env var | Default | Meaning |
|---|---|---|
| `GENERATE_RATE_PER_MIN` | `3` | Max `/api/generate` calls per IP per minute. |
| `GENERATE_RATE_PER_DAY` | `30` | Max `/api/generate` calls per IP per day. |
| `TRUST_PROXY` | unset | Set to `1` only behind a reverse proxy you control, to read the client IP from `X-Forwarded-For`. Otherwise clients spoof it to bypass limits. |

Over-limit requests get `429` + a `Retry-After` header.

> ⚠️ **Single-process only.** The limiter is in-memory, so with more than one
> gunicorn/uwsgi worker the limit is enforced *per worker*. Back it with Redis
> (or `flask-limiter` + Redis) if you scale past one process.

## Cost reporting

`compute_cost(model, tokens_in, tokens_out)` uses a per-model price table (USD per
1M tokens). Every image stores its `model`; `cost_usd` appears in both the
`/api/generate` response and the `/api/images` list. Pre-existing databases are
migrated automatically (a `model` column is added on startup).

## Scene-code sandbox

Two layers. **Read this before deploying publicly.**

### Layer A — static allowlist (`renderer.validate_scene`)

Rejects, before execution: `import`, dunder attribute access (`__class__`,
`__globals__`, …), frame/generator/coroutine introspection attributes
(`f_globals`, `gi_frame`, `cr_frame`, … — these don't start with `_` but reach
the real interpreter), `str.format`/`format_map` template walks, and a denylist of
dangerous builtins. Execution runs with a curated `__builtins__` (no
`__import__`/`open`/`eval`/`exec`/`getattr`).

**Layer A is a speed bump, not a security boundary.** CPython was never designed to
sandbox in-process; the allowlist closes the known escapes but you should assume a
determined attacker can find another. The control you actually trust is Layer B.

### Layer B — process isolation (`sandbox.run_sandboxed`)

Runs `renderer.render()` in a separate process with:

| Env var | Default | Limit |
|---|---|---|
| `SANDBOX_CPU_SECONDS` | `20` | CPU seconds (`RLIMIT_CPU`). |
| `SANDBOX_MEM_MB` | `1024` | Address space (`RLIMIT_AS`). |
| `SANDBOX_FSIZE_MB` | `64` | Max single file written (`RLIMIT_FSIZE`). |
| `SANDBOX_WALL_SECONDS` | `30` | Hard wall-clock kill (parent `SIGKILL`s the process group). |
| `SANDBOX_MAX_IMAGE_PIXELS` | `16777216` | Pillow decompression-bomb guard. |

The child env is stripped of secrets (notably `ANTHROPIC_API_KEY`) so an escape
can't read the key from `os.environ`.

### Required for public/multi-tenant deployment: OS isolation

Layer B's rlimits cap *resources* but do **not** block **network egress** or
**filesystem reads** — a full Layer-A bypass could still `curl` data out or read
`poly.db`/source as the worker UID. For any non-trusted deployment, wrap the worker
in an OS sandbox via `SANDBOX_WRAP`:

```bash
# bubblewrap: no network, read-only FS, only the renders dir writable
export SANDBOX_WRAP='bwrap --unshare-all --die-with-parent \
  --ro-bind / / --tmpfs /tmp --proc /proc --dev /dev \
  --bind /path/to/static/renders /path/to/static/renders'
```

`--unshare-all` includes `--unshare-net`, so even a complete `validate_scene`
bypass cannot exfiltrate. Equivalent `nsjail` configs work too. Also run the app
(and therefore the worker) as a **dedicated unprivileged user** with no access to
other users' files. Leave `SANDBOX_WRAP` empty only for trusted single-user local
use.

## Residual risks (known, accepted, or deferred)

- **In-language sandbox is bypassable in principle.** Treat Layer A as
  defense-in-depth; rely on Layer B + `SANDBOX_WRAP` for the real boundary.
- **`Image.open` / `ImageFont.truetype` file reads.** Reachable (legit fonts need
  `truetype`); contained by `MAX_IMAGE_PIXELS` and, under `SANDBOX_WRAP`, a
  read-only FS.
- **No CAPTCHA / honeypot yet.** Rate limiting is the only bot defense on
  `/api/generate`. Add a honeypot field or Turnstile if you see automated abuse.
- **No NSFW/illegal-content moderation.** Out of scope for this pass; a prompt/
  output moderation hook is the next addition if the app accepts public traffic.

## Quick env reference

```bash
ANTHROPIC_API_KEY=...            # required
TRUST_PROXY=1                    # only behind a trusted reverse proxy
GENERATE_RATE_PER_MIN=3
GENERATE_RATE_PER_DAY=30
SANDBOX_CPU_SECONDS=20
SANDBOX_MEM_MB=1024
SANDBOX_FSIZE_MB=64
SANDBOX_WALL_SECONDS=30
SANDBOX_MAX_IMAGE_PIXELS=16777216
SANDBOX_WRAP='bwrap --unshare-all ...'   # REQUIRED for public deployment
```
