#!/usr/bin/env bash
#
# update.sh — deploy lab980.com on the droplet.
#
# Syncs the web root to origin/main (discarding any local drift), stamps a
# fresh datetime onto the CSS/JS links to bust caches, then reloads nginx.
# Run it after pushing to main:
#
#   /var/www/lab980/update.sh
#
# Overrides (optional):
#   WEBROOT=/some/path ./update.sh     # default: /var/www/lab980
#   BRANCH=main        ./update.sh     # default: main
#
# Wrapped in main() so the whole script is parsed before `git reset` can
# rewrite this file mid-run.

set -euo pipefail

main() {
  local WEBROOT="${WEBROOT:-/var/www/lab980}"
  local BRANCH="${BRANCH:-main}"
  local REPO="https://github.com/ivjames/lab980.com.git"
  local SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"

  cd "$WEBROOT" 2>/dev/null || { echo "!! web root not found: $WEBROOT"; exit 1; }

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "!! $WEBROOT is not a git clone. One-time setup:"
    echo "     cd /var/www && mv lab980 lab980.bak \\"
    echo "       && git clone $REPO lab980"
    exit 1
  fi

  echo "==> Syncing $WEBROOT to origin/$BRANCH"
  local before after
  before="$(git rev-parse --short HEAD)"
  git fetch --quiet origin "$BRANCH"
  git reset --hard --quiet "origin/$BRANCH"
  after="$(git rev-parse --short HEAD)"

  if [ "$before" = "$after" ]; then
    echo "    already current ($after)"
  else
    echo "    $before -> $after"
    git --no-pager log --oneline "$before..$after"
  fi

  # Cache-bust: stamp the asset links with a fresh datetime so browsers always
  # fetch the new CSS/JS. This overwrites the committed ?v= placeholder; the
  # next run's `git reset --hard` restores it before re-stamping, so it stays
  # idempotent (the working tree just carries a one-line diff between runs).
  local v; v="$(date +%Y%m%d%H%M%S)"
  sed -i -E \
    -e "s#(href=\"styles\.css)(\?v=[^\"]*)?\"#\1?v=$v\"#" \
    -e "s#(src=\"main\.js)(\?v=[^\"]*)?\"#\1?v=$v\"#" \
    index.html
  echo "==> Stamped assets ?v=$v"

  # Static files are served straight from disk, so this is mostly belt-and-
  # suspenders — but it validates config and picks up any nginx changes.
  echo "==> Reloading nginx"
  if $SUDO nginx -t >/dev/null 2>&1; then
    $SUDO systemctl reload nginx 2>/dev/null || $SUDO nginx -s reload
    echo "    nginx reloaded"
  else
    echo "!! nginx config test failed — skipping reload; run '$SUDO nginx -t' to see why"
  fi

  echo "==> Done."
}

main "$@"
