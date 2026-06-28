"""
sandbox.py — Part B of the scene-code sandbox (the piece renderer.py's comments
promise but never shipped).

renderer.py Part A (validate_scene + SAFE_BUILTINS) controls *what scene code can
reference*. Part B controls *what it can consume*: render() is run in a separate
process with CPU, memory and output-file-size rlimits plus a hard wall-clock
timeout, so a scene-code escape that slips past Part A is contained — it cannot
exhaust the host, spin forever, or fill the disk.

Network egress: scene code cannot `import socket` (imports are blocked by the AST
allowlist and __import__ is absent from SAFE_BUILTINS), so the untrusted code has
no way to open a socket. The child env is also stripped of secrets (notably
ANTHROPIC_API_KEY) so an escape can't read the key from os.environ.

POSIX only (uses resource + preexec_fn). The app targets Linux, so that's fine.
"""

import os, sys, json, shlex, signal, subprocess, resource

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# OS-level isolation wrapper, prepended to the worker command. The in-language
# allowlist in renderer.validate_scene is a SPEED BUMP, not a boundary — CPython
# introspection (generator/frame walks) can reach the real interpreter. The only
# control that actually contains a full escape is the OS sandbox: no network, a
# read-only filesystem except the output dir, and a dedicated unprivileged UID.
#
# Leave SANDBOX_WRAP empty ONLY for trusted/single-user local use. For any public
# or multi-tenant deployment, set it to a bubblewrap/nsjail invocation, e.g.:
#
#   SANDBOX_WRAP='bwrap --unshare-all --die-with-parent --ro-bind / / \
#       --tmpfs /tmp --bind <RENDERS_DIR> <RENDERS_DIR> --proc /proc --dev /dev'
#
# --unshare-all includes --unshare-net (no egress), so even a full validate_scene
# bypass cannot exfiltrate or phone home.
SANDBOX_WRAP = shlex.split(os.environ.get("SANDBOX_WRAP", ""))

# resource caps (all env-tunable)
CPU_SECONDS  = int(os.environ.get("SANDBOX_CPU_SECONDS", "20"))          # CPU time
MEM_MB       = int(os.environ.get("SANDBOX_MEM_MB", "1024"))            # address space
FSIZE_MB     = int(os.environ.get("SANDBOX_FSIZE_MB", "64"))           # max single file write
WALL_SECONDS = int(os.environ.get("SANDBOX_WALL_SECONDS", "30"))       # parent-enforced kill
MAX_PIXELS   = int(os.environ.get("SANDBOX_MAX_IMAGE_PIXELS", str(4096 * 4096)))


class SandboxError(Exception):
    """Render failed inside the sandbox (timeout, rlimit kill, or render error)."""


# ── parent side ─────────────────────────────────────────────────────────────
def _set_limits():
    """Run in the child after fork, before exec. Applies rlimits + new session."""
    mem = MEM_MB * 1024 * 1024
    fsize = FSIZE_MB * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_CPU,   (CPU_SECONDS, CPU_SECONDS + 2))
    resource.setrlimit(resource.RLIMIT_AS,    (mem, mem))
    resource.setrlimit(resource.RLIMIT_FSIZE, (fsize, fsize))
    try:
        resource.setrlimit(resource.RLIMIT_NPROC, (64, 64))
    except (ValueError, OSError):
        pass
    os.setsid()  # own process group, so a timeout can kill the whole tree


def _child_env():
    # Minimal env: drop secrets (ANTHROPIC_API_KEY, cloud creds) so an escape in
    # the render process can't read them. Keep only what PIL/fontconfig need.
    keep = ("PATH", "LANG", "LC_ALL", "TMPDIR", "FONTCONFIG_PATH", "FONTCONFIG_FILE")
    env = {k: os.environ[k] for k in keep if k in os.environ}
    env["HOME"] = os.environ.get("TMPDIR", "/tmp")
    env["PYTHONUNBUFFERED"] = "1"
    return env


def run_sandboxed(scene_code, filename="output.png", width=1024, height=1024,
                  seed=42, preset=None, thumbnail=True, output_dir=None):
    """Render scene_code in an isolated child process. Returns renderer.render()'s
    dict, or raises SandboxError. Drop-in for a direct render() call."""
    payload = json.dumps({
        "scene_code": scene_code,
        "filename": filename, "width": width, "height": height, "seed": seed,
        "preset": preset, "thumbnail": thumbnail, "output_dir": output_dir,
    }).encode()

    cmd = SANDBOX_WRAP + [sys.executable, os.path.join(BASE_DIR, "sandbox.py"), "--worker"]
    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        preexec_fn=_set_limits, cwd=BASE_DIR, env=_child_env(),
    )
    try:
        out, err = proc.communicate(payload, timeout=WALL_SECONDS)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        except (ProcessLookupError, OSError):
            pass
        proc.communicate()
        raise SandboxError(f"render exceeded the {WALL_SECONDS}s wall-clock limit")

    if proc.returncode != 0:
        # Negative return code == killed by signal. Map the rlimit signals.
        rc = proc.returncode
        reason = {
            -signal.SIGXCPU: f"render exceeded the {CPU_SECONDS}s CPU limit",
            -signal.SIGXFSZ: f"render exceeded the {FSIZE_MB}MB output-size limit",
            -signal.SIGKILL: f"render killed (likely exceeded the {MEM_MB}MB memory limit)",
            -signal.SIGSEGV: "render crashed (segfault)",
        }.get(rc, f"render process exited with code {rc}")
        tail = (err or b"").decode("utf-8", "replace").strip()[-300:]
        raise SandboxError(f"{reason}{(': ' + tail) if tail else ''}")

    try:
        result = json.loads(out)
    except (ValueError, json.JSONDecodeError):
        raise SandboxError("sandbox produced no parseable result")
    if "error" in result:
        raise SandboxError(result["error"])
    return result["result"]


# ── child side ──────────────────────────────────────────────────────────────
def _worker():
    data = json.loads(sys.stdin.buffer.read())

    # Decompression-bomb guard inside the untrusted process, before any render.
    from PIL import Image as _Img
    _Img.MAX_IMAGE_PIXELS = MAX_PIXELS

    from renderer import render, SceneValidationError
    try:
        result = render(
            data["scene_code"], filename=data["filename"],
            width=data["width"], height=data["height"], seed=data["seed"],
            ref=None, preset=data["preset"], thumbnail=data["thumbnail"],
            _output_dir=data["output_dir"],
        )
        sys.stdout.write(json.dumps({"result": result}))
    except SceneValidationError as e:
        sys.stdout.write(json.dumps({"error": f"Scene rejected by sandbox: {e}"}))
    except Exception as e:
        sys.stdout.write(json.dumps({"error": f"Render error: {e}"}))


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--worker":
        _worker()
    else:
        print("sandbox.py is invoked internally by run_sandboxed(); not a CLI.")
        sys.exit(1)
