const projects = [
  {
    id: 'photo-studio',
    tag: 'Web · Python · Self-Hosted',
    name: 'Photo Studio',
    desc: 'A self-hosted web app for digitizing physical photo collections. Drag crop regions over flatbed scans, straighten and deskew individual photos, tag and organize them into folders, then export the whole thing as a zip. Built for the kind of shoebox-full-of-prints problem that never quite got solved.',
    status: 'active',
    statusText: 'Live (somehow)',
    accentNote: 'Demo mode coming soon.',
    detail: `Photo Studio started as a personal problem: a shoebox of old prints with no good way to digitize them without paying for a service or doing it manually one by one.\n\nThe app runs locally on your own machine. You load a flatbed scan, drag crop handles over each individual photo in the scan, and the app extracts, straightens, and deskews them automatically. Results go into tagged folders. When you're done, export everything as a zip.\n\nBuilt with Python on the backend and a browser-based frontend. No cloud, no subscription, no uploading your family photos to someone else's server.\n\nA public demo mode is in the works -- until then it's self-hosted only.`,
    stack: ['Python', 'Flask', 'OpenCV', 'HTML/CSS/JS'],
    links: [{ label: 'Live Site', url: 'https://photos.lab980.com' }]
  },
  {
    id: 'capcrop',
    tag: 'SaaS · Photo · AI',
    name: 'CapCrop',
    desc: "Photo Studio, except it grew up and got a business model. Same shoebox-of-prints problem -- batch-scan, auto-crop, straighten, restore, tag -- now an actual product with its own domain. \"Rescue every photo from the scanner bed.\" Private beta in 2026, which is conveniently now.",
    status: 'wip',
    statusText: 'Private Beta -- 2026',
    detail: `CapCrop is the grown-up version of Photo Studio: the same shoebox-of-prints problem, rebuilt as a real product with its own domain and an actual tagline -- "rescue every photo from the scanner bed."\n\nDrop in a flatbed scan with several photos on it and CapCrop pulls each one out by bounding box, straightens it, and cleans it up -- fading, dust, and scratch removal, plus color-negative inversion for film. AI handles captions and tag suggestions, but only when you ask it to, and you can bring your own API key.\n\nEverything exports as organized, fully-backed-up ZIPs, sorted into folders. Your photos are never used to train anything, and you can export or delete all of it whenever you want.\n\nPrivate beta in 2026. Early-access signup is live -- which, as of right now, is the move.`,
    stack: ['Web App', 'AI Restoration', 'Auto-Tagging', 'BYO API Key'],
    links: [{ label: 'Early Access', url: 'https://capcrop.com' }]
  },
  {
    id: 'mbw',
    tag: 'Web · Node · SQLite',
    name: 'MarketingBuzzworthy',
    desc: 'A demo site built for a marketing company that never went anywhere. Multipage frontend, Node backend, contact form that actually stores submissions in a SQLite mailbox with read/unread and delete. Technically solid. Commercially deceased.',
    status: 'archived',
    statusText: "Archived (it's fine)",
    detail: `MarketingBuzzworthy was a demo site commissioned by a marketing company as a proof of concept for a client-facing product. The company folded before it shipped.\n\nThe site itself is a complete multipage frontend -- home, services, about, contact -- with a Node backend handling contact form submissions. Those submissions land in a SQLite-backed admin mailbox with read/unread state and delete. One-command production deploy script included.\n\nIt's a solid reference implementation for anyone building a small marketing site with a real backend. The code is cleaner than the business case was.\n\nCurrently archived but browsable at its subdomain as a technical demo.`,
    stack: ['Node.js', 'Express', 'SQLite', 'Vanilla JS', 'Nginx'],
    links: [
      { label: 'Live Demo', url: 'https://mbw.lab980.com' },
      { label: 'GitHub', url: 'https://github.com/ivjames/MBW' }
    ]
  },
  {
    id: 'lucky-felt',
    tag: 'Web · Vite · Static',
    name: 'Lucky Felt Casino',
    desc: "A browser casino with no real stakes. Texas Hold'em, Roulette, Craps, Sic Bo, and three slot machines. Passwordless accounts via localStorage -- no backend, no server, no excuses. Pure frontend degeneracy.",
    status: 'active',
    statusText: 'Live (somehow)',
    detail: `Lucky Felt Casino is a fully functional browser casino with zero real money involved and zero backend required.\n\nGames: Texas Hold'em poker with full betting rounds, Roulette with inside and outside bets, Craps, Sic Bo, and three slot machines with different volatility profiles.\n\nAccounts are email-based and passwordless -- everything lives in localStorage. No server, no database, no auth headaches. That also means accounts are per-browser, but for a demo casino that's fine.\n\nBuilt with Vite as a pure static site. Deploys anywhere -- DigitalOcean App Platform, Netlify, Vercel, or just nginx serving a dist folder.`,
    stack: ['Vite', 'Vanilla JS', 'CSS', 'localStorage'],
    links: [
      { label: 'Play Now', url: 'https://casino.lab980.com' },
      { label: 'GitHub', url: 'https://github.com/ivjames/lucky-felt' }
    ]
  },
  {
    id: 'pillow-polygons',
    tag: 'Web · Python · AI',
    name: 'Pillow Polygons',
    desc: "Type a prompt, pick a Claude model, get low-poly geometric art back as SVG or PNG. Named after the Python imaging library, not a throw cushion. Feed it a reference image and it'll lift the palette right off it.",
    status: 'active',
    statusText: 'Live (somehow)',
    detail: `Pillow Polygons turns a text prompt into low-poly geometric art. Describe what you want, pick which Claude model does the thinking -- Haiku, Sonnet, or Opus -- and it generates the piece as scalable SVG or a flat PNG.\n\nThe name is a Python joke: it runs on Pillow, the imaging library, not a soft furnishing. Hand it a reference image and it samples a palette straight off it, so the output matches whatever vibe you're chasing.\n\nThe backend is Python on Flask serving a single-page frontend. The actual taste lives in an Anthropic API call that decides shapes and colors, with Pillow doing the rasterizing.\n\nIt makes genuinely nice wallpapers. That's the entire pitch.`,
    stack: ['Python', 'Flask', 'Pillow', 'Anthropic API', 'HTML/CSS/JS'],
    links: [{ label: 'Live Site', url: 'https://poly.lab980.com' }]
  },
  {
    id: 'qa-ksink',
    tag: 'Web · Python · Test Automation',
    name: 'QA KSink',
    desc: "Two halves of one joke: a 'kitchen sink' website built to be deliberately, thoroughly broken, and a bot whose whole job is finding everything wrong with it. The dashboard streams the live browser as it clicks through the wreckage and files a report.",
    status: 'active',
    statusText: 'Live (somehow)',
    detail: `QA KSink is two halves of the same joke: a "kitchen sink" website built to be deliberately, comprehensively broken, and a bot whose entire purpose is finding everything wrong with it.\n\nThe dashboard kicks off an automated browser run against the target, streams the live browser feed so you can watch it work through forms, dead links, and bad states in real time, then generates a report of what it caught.\n\nIt started as a way to practice test-automation tooling without needing a real app to break -- so the broken app became part of the project. Two birds.\n\nBackend is Python driving a headless browser, fronted by a small API (/api/run, /api/status, /api/log) feeding the live dashboard.`,
    stack: ['Python', 'Flask', 'Headless Browser', 'WebSockets', 'HTML/CSS/JS'],
    links: [
      { label: 'Bot Dashboard', url: 'https://qa-bot.lab980.com' },
      { label: 'Target Site', url: 'https://qa-demo.lab980.com' }
    ]
  },
  {
    id: 'lab980',
    tag: 'Meta · HTML · CSS · JS',
    name: 'lab980.com',
    desc: "The site you're looking at. Built during late-night iPad sessions with Claude, deployed to a DigitalOcean droplet, and perpetually one project away from being finished. The real project was the nginx configs we made along the way.",
    status: 'wip',
    statusText: 'In Progress (obviously)',
    detail: `This site is itself a project worth documenting.\n\nIt started as a "coming soon" page and grew into a full showcase during a single long session -- design direction, copy, structure, and deployment all figured out in conversation with Claude.\n\nThe stack is deliberately simple: plain HTML, CSS, and vanilla JS. No framework, no build step, no node_modules. It serves fast, it deploys with a heredoc, and it's editable from an iPad over SSH.\n\nThe workflow: Working Copy on iPad for git, Termius for SSH, Claude for pair programming. The droplet runs nginx with certbot for SSL. Each project gets its own subdomain and nginx config.\n\nIt's never going to be "done." That's the point.`,
    stack: ['HTML', 'CSS', 'Vanilla JS', 'Nginx', 'DigitalOcean'],
    links: [{ label: 'GitHub', url: 'https://github.com/ivjames/lab980.com' }]
  }
];

// ─── RENDER CARDS ─────────────────────────────────────────
function renderCards() {
  const grid = document.querySelector('.projects-grid');
  grid.innerHTML = projects.map(p => `
    <div class="project-card" data-id="${p.id}" role="button" tabindex="0" aria-label="View details for ${p.name}">
      <span class="project-tag">${p.tag}</span>
      <h3 class="project-name">${p.name}</h3>
      <p class="project-desc">${p.desc}${p.accentNote ? ` <span class="accent-note">${p.accentNote}</span>` : ''}</p>
      <span class="project-status">
        <span class="project-status-dot ${p.status}"></span>
        ${p.statusText}
      </span>
      <span class="card-cta">View Details ↗</span>
    </div>
  `).join('');

  grid.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(card.dataset.id); });
  });
}

// ─── MODAL ────────────────────────────────────────────────
function openModal(id) {
  const p = projects.find(p => p.id === id);
  if (!p) return;

  const modal = document.getElementById('project-modal');
  modal.querySelector('.modal-tag').textContent = p.tag;
  modal.querySelector('.modal-title').textContent = p.name;
  modal.querySelector('.modal-status-dot').className = `modal-status-dot project-status-dot ${p.status}`;
  modal.querySelector('.modal-status-text').textContent = p.statusText;
  modal.querySelector('.modal-detail').innerHTML = p.detail.split('\n\n').map(para => `<p>${para}</p>`).join('');
  modal.querySelector('.modal-stack').innerHTML = p.stack.map(s => `<span class="stack-tag">${s}</span>`).join('');
  modal.querySelector('.modal-links').innerHTML = p.links.map(l =>
    `<a href="${l.url}" target="_blank" rel="noopener" class="modal-link">${l.label} ↗</a>`
  ).join('');

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  modal.querySelector('.modal-close').focus();
}

function closeModal() {
  const modal = document.getElementById('project-modal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

// ─── SCROLL ───────────────────────────────────────────────
document.querySelector('.cta-secondary').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
});

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderCards();

  const modal = document.getElementById('project-modal');
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
});
