# Deploying lab980.com

The site is plain static files (`index.html`, `main.js`, `styles.css`) — no
build step, no `node_modules`. It's served by **nginx** on a **DigitalOcean
droplet**, with **certbot** handling SSL. Each lab980 subdomain has its own
nginx server block; this doc covers the apex `lab980.com` only.

> Fill in the two placeholders below for your setup:
> - `DROPLET` — the SSH host (e.g. `user@lab980.com` or an IP)
> - `WEBROOT` — the directory nginx serves this site from (e.g. `/var/www/lab980.com`)

## Method 1 — git pull (preferred)

Once the droplet has a deploy key for this repo, deploying is just merging to
`main` and pulling on the server:

```bash
# locally: land the change on main (PR or direct push)
git push

# on the droplet:
ssh DROPLET 'cd WEBROOT && git pull'
```

If the webroot isn't itself a git clone yet, set it up once:

```bash
ssh DROPLET 'git clone https://github.com/ivjames/lab980.com.git WEBROOT'
```

…and add a deploy key so `git pull` works without a password:

```bash
# on the droplet
ssh-keygen -t ed25519 -C "lab980-droplet" -f ~/.ssh/lab980_deploy
cat ~/.ssh/lab980_deploy.pub
# add that public key to the repo: GitHub → Settings → Deploy keys → Add (read-only is fine)
# point the clone at SSH so the key is used:
ssh DROPLET 'cd WEBROOT && git remote set-url origin git@github.com:ivjames/lab980.com.git'
```

## Method 2 — heredoc (fallback, no deploy key)

When the droplet can't `git pull`, write the changed files directly over SSH.
Only redeploy the files that actually changed.

**Always use a _quoted_ heredoc delimiter** (`<< 'EOF'`). `main.js` is full of
template-literal backticks and `${...}`; an unquoted heredoc lets the shell
expand them and corrupts the file. Quoting writes the bytes literally.

```bash
ssh DROPLET
cd WEBROOT

cat > index.html << 'LAB980_EOF'
...full file contents...
LAB980_EOF

cat > main.js << 'LAB980_EOF'
...full file contents...
LAB980_EOF
```

## Verify

Static files are served immediately — no nginx reload needed. If a cache sits
in front, reload/purge it:

```bash
ssh DROPLET 'sudo nginx -t && sudo nginx -s reload'   # only if needed
```

Then confirm the live site:

```bash
curl -s https://lab980.com | grep -o 'stat-num">[0-9]*'   # project count
```

## Notes

- No CI on this repo; nothing runs on push beyond the deploy above.
- Editing workflow: Working Copy (iPad) for git, Termius for SSH.
- Keep `main` the source of truth — deploy from it, not from feature branches.
