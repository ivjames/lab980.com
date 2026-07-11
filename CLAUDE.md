# lab980 platform conventions

Shared context for every site on the lab980 droplet.

All sites live on one Ubuntu droplet serving many `*.lab980.com` subdomains
(host IP 165.22.128.19). New projects should match this shape:

- One directory per site: /var/www/<name>. Everything for a site lives in its dir.
- Config + data in the app dir (local .env, data/ for SQLite), not /etc or /var/lib.
  No dedicated service user — apps run as root.
- Process manager: pm2. One app per site on its own local port (8060+); pm2 save.
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

  provision-site <stub> [repo]       # DO DNS + /var/www dir + repo clone + nginx + TLS
  deprovision-site <stub>            # tear down nginx + cert + DNS (--purge also wipes dir+pm2)

Provision stops before build/run — each site is deployed its own way afterward
(typically: cd /var/www/<stub> && npm ci && npm run build && pm2 start ... && pm2 save).

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

## Engineering lessons

- Verify a CLEAN clone builds, not just the working tree:
  git archive HEAD | tar -x -C /tmp/x && cd /tmp/x && npm ci && npm run build
- Watch kitchen-sink .gitignore files silently excluding real source dirs
  (e.g. a Python `lib/` rule eating a JS `lib/`). git ls-files <dir> to confirm.
- Prisma blocks destructive CLI actions for AI agents (db push --force-reset,
  migrate reset). Delete the target file and run a plain db push/migrate deploy.
