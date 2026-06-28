# pillow-poly — anti-abuse staging

This directory is a **handoff/staging area**, not part of lab980.com. It holds the
anti-abuse + scene-code sandboxing work for the separate **Pillow Polygons** project
(a Flask app that executes Claude-generated Python to render images).

It lives on this branch because the work was done in a session scoped to
`ivjames/lab980.com`; it is meant to be **applied to the Pillow Poly repo**, not run
from here.

Start with **`ANTI_ABUSE_TASK.md`** — the full handoff brief. Files:

- `app.py` — rate limiting, text-only API, input clamping, token-cost, sandboxed render.
- `sandbox.py` — subprocess isolation (rlimits, wall-clock, secret-stripped env, `SANDBOX_WRAP` OS-jail hook).
- `renderer.py` — the project's renderer with the `validate_scene` security patch (frame-introspection + `format` denylist).
- `README_ANTIABUSE.md` — README section to merge into the Pillow Poly project.
- `deploy/pillowpoly.service` — sample systemd unit (dedicated user + bubblewrap).
