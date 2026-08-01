# lab980 platform conventions

Shared context for every site on the lab980 droplet.

All sites live on one Ubuntu droplet serving many `*.lab980.com` subdomains
(host IP 165.22.128.19). New projects should match this shape:

- One directory per site: /var/www/<name>. Everything for a site lives in its dir.
- Config + data in the app dir (local .env, data/ for SQLite), not /etc or /var/lib.
  No dedicated service user — apps run as root.
- Process manager: pm2. One app per site on its own local port (8060+); pm2 save.
  Reboot survival needs the boot hook installed ONCE per droplet
  (`pm2 startup systemd -u root --hp /root`, then run the line it prints;
  verify `systemctl is-enabled pm2-root` -> enabled). `pm2 save` alone only
  writes the dump — nothing replays it at boot without the hook.
- nginx per site: /etc/nginx/sites-available/<fqdn> symlinked to sites-enabled/,
  proxying to the app's local port.
- TLS: per-site certbot (certbot --nginx -d <fqdn> --redirect), auto-renewed. No wildcard.
- DNS: one A record per subdomain -> droplet IP (DigitalOcean, managed via doctl).
- Node 18.18+ (box has 20 LTS); pm2 is global.
- Operate CLI: each project ships bin/<name> symlinked to /usr/local/bin/<name>
  (redeploy/restart/logs/backup). Deploy = git pull -> install -> build -> pm2 restart.

## Provisioning a new subdomain

Infra scaffolding is scripted in this repo's bin/. Symlink each script onto
PATH under its own name (once, on the droplet):

  ln -sf /var/www/lab980/bin/provision-site   /usr/local/bin/provision-site
  ln -sf /var/www/lab980/bin/deprovision-site /usr/local/bin/deprovision-site
  ln -sf /var/www/lab980/bin/renew-certs      /usr/local/bin/renew-certs
  ln -sf /var/www/lab980/bin/fix-nginx-http2  /usr/local/bin/fix-nginx-http2

  provision-site <stub> [repo]       # DO DNS + /var/www dir + repo clone + nginx + TLS
  deprovision-site <stub>            # tear down nginx + cert + DNS (--purge also wipes dir+pm2)
  renew-certs                        # renew any cert expiring within 2 days (see below)
  fix-nginx-http2                    # audit/fix "protocol options redefined" warnings (see below)

Provision stops before build/run — each site is deployed its own way afterward
(typically: cd /var/www/<stub> && npm ci && npm run build && pm2 start ... && pm2 save).

- **prm** (`prm.lab980.com`, repo `ivjames/prm`) — a personal-relationship
  manager on a **hybrid** shape: the backend is external **Supabase**
  (managed Postgres + Auth + RLS), while the droplet serves the web PWA and
  runs the ingestion/cadence workers under pm2 (`prm-web` binds the site port;
  `prm-worker` binds none). So the droplet holds no DB for this site — the
  `data/` dir and SQLite convention don't apply here. Provision with
  `provision-site prm ivjames/prm`, then follow `prm/DEPLOY.md` (fill `.env`
  with the Supabase keys, `pm2 start ecosystem.config.cjs`).

### Sites on their own domain (apex, not a *.lab980.com subdomain)

A site can graduate off `*.lab980.com` onto its own domain while still being
served from this droplet — same one-dir-per-site/pm2/nginx/certbot shape, just
a different DNS zone and an apex vhost. `provision-site` takes `@` as the stub
for the bare apex (server_name `<domain>` + `www.<domain>`, cert covering both,
DNS A for `@` and `www`):

  provision-site @ ivjames/boxoffice --domain boxo.show --dir /var/www/boxoffice

Add the new domain as a DigitalOcean zone first (`doctl compute domain create
<domain>`). `--no-www` drops the www half if you only want the apex.

- **boxoffice** moved off `boxoffice.lab980.com` to its own **boxo.show** apex
  (its own tenant subdomains + a `beta.boxo.show` staging deploy). It still
  lives in `/var/www/boxoffice` on this box — see `boxoffice/DEPLOY.md`
  ("Moving boxoffice to its own boxo.show domain") for the full cutover runbook.

## Certificate renewal sweep

certbot's own systemd timer already renews at the 30-day mark. `renew-certs`
is a tighter, explicit backstop: it walks every cert under
`/etc/letsencrypt/live/*`, reads each leaf's `notAfter` straight from
`cert.pem`, isolates the ones expiring within the next N days (default 2), and
runs `certbot renew --cert-name <name>` for each. Renewals go through the nginx
installer, so nginx reloads with the fresh cert automatically.

  renew-certs                  # sweep now: renew anything due within 2 days
  renew-certs --days 5         # widen the window
  renew-certs --dry-run        # simulate (certbot staging renewal, no replace)
  renew-certs --force          # add --force-renewal (safe: we pre-filter)

Install the cron once on the droplet (writes /etc/cron.d/lab980-renew-certs,
a twice-daily 03:23/15:23 sweep logging to /var/log/lab980-renew-certs.log):

  renew-certs --install-cron
  renew-certs --uninstall-cron # remove it

## nginx "protocol options redefined" warnings

On reload/restart nginx may emit, once per disagreeing listen line:

    [warn] protocol options redefined for 0.0.0.0:443 in /etc/nginx/sites-enabled/<site>:NN

Cause: every site shares the same 0.0.0.0:443 / [::]:443 sockets, and nginx
keeps ONE set of protocol options (http2, proxy_protocol, ...) per socket —
it warns whenever vhosts disagree. Ours drift because certbot writes the 443
listen lines at provision time and changed style over the years: older
certbot wrote `listen 443 ssl http2;`, newer writes `listen 443 ssl;`.
Harmless — nginx merges the options, so http2 stays enabled for the whole
socket if any vhost asks for it — but it's noise on every deploy.

Fix with `fix-nginx-http2` (audits by default, read-only):

  fix-nginx-http2            # report which vhosts disagree about http2
  fix-nginx-http2 --dry-run  # show the exact diff --fix would apply
  fix-nginx-http2 --fix      # rewrite so all vhosts agree http2 is on,
                             # then nginx -t + reload

It picks the right form for the installed nginx (>= 1.25.1 gets the modern
per-server `http2 on;` directive; older gets the `http2` listen flag added
everywhere), backs up every touched file under /var/backups/, and rolls the
whole change back if nginx -t fails. Idempotent — re-run any time the
warnings reappear (e.g. after provisioning a new site with a certbot whose
style differs from the existing vhosts).

## Engineering lessons

- Verify a CLEAN clone builds, not just the working tree:
  git archive HEAD | tar -x -C /tmp/x && cd /tmp/x && npm ci && npm run build
- Watch kitchen-sink .gitignore files silently excluding real source dirs
  (e.g. a Python `lib/` rule eating a JS `lib/`). git ls-files <dir> to confirm.
- Prisma blocks destructive CLI actions for AI agents (db push --force-reset,
  migrate reset). Delete the target file and run a plain db push/migrate deploy.
- pm2: setting `instances` in an ecosystem file silently flips a process into
  cluster mode, and cluster-mode startup crashes land in `~/.pm2/pm2.log`, not
  the app's own error log — a crash-looping app with EMPTY logs is the tell.
  Every site here runs `fork`; set `exec_mode: "fork"` explicitly and omit
  `instances`. (Also: `pm2 restart` won't change an already-registered
  process's mode — `pm2 delete` + `pm2 start` to actually switch it.)

## Follow-ups / pending maintenance

- **Node 20 -> 22 upgrade (droplet-wide).** The box is on Node 20 LTS, but
  `@supabase/supabase-js` now emits a deprecation warning on Node <=20 and will
  drop support in a future release (surfaced by the `prm` site). Non-blocking
  today — everything runs — but plan a droplet-wide bump to Node 22 LTS. Rebuild
  each site (`npm ci && npm run build`) and `pm2 restart` after upgrading.
  **Pre-flight before bumping:** `bin/node22-audit` (symlink to PATH like the
  other bin/ scripts) walks every `/var/www/*` site and reports, per site, its
  declared `engines.node`, any native deps needing a rebuild, and a throwaway
  clean-build test under a side-by-side Node 22 — all read-only, without
  touching the running Node 20 processes:

    node22-audit --fetch-node22        # downloads Node 22 to /tmp, build-tests each site
    node22-audit --node22 /path/to/node22/bin/node   # use an already-installed 22

  Gate the bump on a clean matrix; anything red gets its /tmp/n22-<site>.log
  inspected first. Native modules still need `npm rebuild` after the actual bump.

  **Doing the bump:** the Supabase client (`@supabase/supabase-js` >=2.110)
  now *hard-requires* native WebSocket (Node 22+), so `prm` no longer runs on
  Node 20 — this is a real forcing function, not just the deprecation warning.
  Steps, in order:
    1. (manual) install Node 22 as the default runtime — however node is
       managed on the box: nodesource
       (`curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs`),
       or `n 22`, or nvm. Verify `node -v` -> v22.
    2. `bin/node22-bump` (symlink to PATH like the others) does the rest:
       reinstalls pm2 under 22, recompiles every /var/www/* site's native
       modules against the new ABI (Node 20 = MODULE_VERSION 115, 22 = 127 —
       old *.node won't load), then `pm2 update` + `pm2 save`, gated so it
       won't restart if any site failed to rebuild. `--dry-run` first.
    3. (manual) confirm the boot hook still points at the new node
       (`systemctl is-enabled pm2-root`; re-run `pm2 startup ...` if the node
       path changed), and spot-check a couple of health endpoints.
