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

Infra scaffolding is scripted (in this repo's bin/, symlinked to /usr/local/bin):

  lab980-provision <stub> [repo]     # DO DNS + /var/www dir + repo clone + nginx + TLS
  lab980-deprovision <stub>          # tear down nginx + cert + DNS (--purge also wipes dir+pm2)

Provision stops before build/run — each site is deployed its own way afterward
(typically: cd /var/www/<stub> && npm ci && npm run build && pm2 start ... && pm2 save).

## Engineering lessons

- Verify a CLEAN clone builds, not just the working tree:
  git archive HEAD | tar -x -C /tmp/x && cd /tmp/x && npm ci && npm run build
- Watch kitchen-sink .gitignore files silently excluding real source dirs
  (e.g. a Python `lib/` rule eating a JS `lib/`). git ls-files <dir> to confirm.
- Prisma blocks destructive CLI actions for AI agents (db push --force-reset,
  migrate reset). Delete the target file and run a plain db push/migrate deploy.
