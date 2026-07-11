const projects = [
  {
    id: 'photo-studio',
    tag: 'Web · Python · Self-Hosted',
    name: 'Photo Studio',
    desc: 'A self-hosted web app for digitizing physical photo collections. Drag crop regions over flatbed scans, straighten and deskew individual photos, tag and organize them into folders, then export the whole thing as a zip. The MVP that CapCrop grew out of -- now retired behind a login while the grown-up version takes over.',
    status: 'active',
    statusText: 'Alive, but private now',
    detail: `Photo Studio started as a personal problem: a shoebox of old prints with no good way to digitize them without paying for a service or doing it manually one by one.\n\nThe app runs locally on your own machine. You load a flatbed scan, drag crop handles over each individual photo in the scan, and the app extracts, straightens, and deskews them automatically. Results go into tagged folders. When you're done, export everything as a zip.\n\nBuilt with Python on the backend and a browser-based frontend. No cloud, no subscription, no uploading your family photos to someone else's server.\n\nIt did its job so well it earned a sequel: CapCrop is the productized version, and Photo Studio now lives quietly behind a login.`,
    stack: ['Python', 'Flask', 'OpenCV', 'HTML/CSS/JS'],
    links: []
  },
  {
    id: 'capcrop',
    tag: 'SaaS · Python · AI',
    name: 'CapCrop',
    desc: "Photo Studio, except it grew up and got a business model. That one was the MVP; this is the real product -- same shoebox-of-prints problem (batch-scan, auto-crop, straighten, restore, tag), now on its own domain. \"Rescue every photo from the scanner bed.\" In private beta as of 2026, which is conveniently now.",
    status: 'wip',
    statusText: 'Private Beta -- 2026',
    detail: `CapCrop is what happens when Photo Studio grows up. That one was the MVP -- enough to prove the shoebox-of-prints problem was worth solving. CapCrop is the same idea rebuilt as a real product, on the same Python foundation, with its own domain and an actual tagline: "rescue every photo from the scanner bed."\n\nDrop in a flatbed scan with several photos on it and CapCrop pulls each one out by bounding box, straightens it, and cleans it up -- fading, dust, and scratch removal, plus color-negative inversion for film. AI handles captions and tag suggestions, but only when you ask it to, and you can bring your own API key.\n\nEverything exports as organized, fully-backed-up ZIPs, sorted into folders. Your photos are never used to train anything, and you can export or delete all of it whenever you want.\n\nPrivate beta in 2026. Early-access signup is live -- which, as of right now, is the move.`,
    stack: ['Python', 'Flask', 'OpenCV', 'AI Restoration', 'HTML/CSS/JS'],
    links: [{ label: 'Early Access', url: 'https://capcrop.com' }]
  },
  {
    id: 'atheismiq',
    tag: 'Web · Next.js · Postgres',
    name: 'AtheismIQ',
    desc: 'A quiz that finds out what you actually know about atheism. Two intake questions place you on the belief/knowledge grid, the quiz itself covers the misconceptions everyone confidently repeats, and you get a named position, a score, and a share card generated on the fly.',
    status: 'active',
    statusText: 'Live (somehow)',
    detail: `AtheismIQ is a shareable quiz app about atheism -- the terminology, the misconceptions, and where you actually land on the belief/knowledge axes.\n\nTwo intake questions place you on the grid (agnostic atheist, gnostic theist, and so on), then the quiz tests you on the things people get wrong most. Instant scoring, an answer-review modal with sourced explanations, and a leaderboard.\n\nEvery result gets its own shareable URL with a dynamically generated Open Graph card -- rendered in-house with next/og, no external image service. Player types are stored as two boolean flags, which makes for a fun stats query: right/wrong rates broken down by who's answering.\n\nSeeding is idempotent, so redeploys never wipe anyone's results. Small detail, hard-won.`,
    stack: ['Next.js 15', 'TypeScript', 'Prisma', 'PostgreSQL', 'Tailwind'],
    links: [{ label: 'Take the Quiz', url: 'https://atheismiq.lab980.com' }]
  },
  {
    id: 'artificial-atheist',
    tag: 'AI · Eleventy · Autonomous',
    name: 'Artificial Atheist',
    desc: "A publication that writes itself. Every other day a GitHub Action wakes up, asks Claude for an article on the least-covered topic, generates an illustration, commits the result, and redeploys the site. No server process. No human in the loop -- unless I feel like steering.",
    status: 'active',
    statusText: 'Live & self-publishing',
    detail: `Artificial Atheist is an AI-authored publication on atheism, skepticism, and critical thinking -- and the whole editorial pipeline is a scheduled GitHub Action.\n\nEvery other day the generator inventories what's already been published, picks the least-covered topic, asks Claude for an article with a genuinely new angle (titles are deduped against the archive), generates an AI illustration, and commits Markdown. The commit triggers a static rebuild and the piece is live. Nobody touched anything.\n\nWhen I do want a say, there's a local human-in-the-loop "Studio" for steering an article from a seed idea. There's also an A/B harness that runs the same prompt through every AI provider I have keys for and logs latency and word count -- the generator itself is provider-agnostic.\n\nCurrent work: wiring it up to push new posts to Facebook automatically, because a publication that writes itself should market itself too.`,
    stack: ['Eleventy', 'Node', 'Claude API', 'OpenAI Images', 'GitHub Actions'],
    links: [{ label: 'Read It', url: 'https://artificialatheist.com' }]
  },
  {
    id: 'mbw',
    tag: 'Web · Node · SQLite',
    name: 'Marketing Buzzworthy',
    desc: 'A demo site built for a marketing company that never went anywhere. Multipage frontend, Node backend, contact form that actually stores submissions in a SQLite mailbox with read/unread and delete. Technically solid. Commercially deceased -- but the demo is live.',
    status: 'active',
    statusText: 'Live Demo',
    detail: `Marketing Buzzworthy was a demo site commissioned by a marketing company as a proof of concept for a client-facing product. The company folded before it shipped.\n\nThe site itself is a complete multipage frontend -- home, services, about, contact -- with a Node backend handling contact form submissions. Those submissions land in a SQLite-backed admin mailbox with read/unread state and delete. One-command production deploy script included.\n\nIt's a solid reference implementation for anyone building a small marketing site with a real backend. The code is cleaner than the business case was.\n\nIt's live and browsable at its subdomain as a working technical demo.`,
    stack: ['Node.js', 'Express', 'SQLite', 'Vanilla JS', 'Nginx'],
    links: [
      { label: 'Live Demo', url: 'https://mbw.lab980.com' },
      { label: 'GitHub', url: 'https://github.com/ivjames/MBW' }
    ]
  },
  {
    id: 'lucky-felt',
    tag: 'Web · React · Express',
    name: 'Lucky Felt Casino',
    desc: "A browser casino with no real stakes. Texas Hold'em, Roulette, Craps, Sic Bo, and three slot machines. The browser is treated as hostile: every outcome is computed server-side with cryptographic randomness, and sign-in is passwordless email codes. Pure degeneracy, rigorously enforced.",
    status: 'active',
    statusText: 'Live (somehow)',
    detail: `Lucky Felt Casino is a fully functional browser casino with zero real money involved -- and a security model that pretends otherwise.\n\nGames: Texas Hold'em poker with full betting rounds, Roulette with inside and outside bets, Craps, Sic Bo, and three slot machines with different volatility profiles.\n\nThe frontend never decides anything that matters. All money-deciding randomness runs server-side through crypto.randomInt, payout tables live on the server as the single source of truth, every bet is validated, and poker hole cards stay server-side until showdown. If you can cheat it from the browser, that's a bug report I want.\n\nAccounts are email-based and passwordless: hashed, single-use, expiring 6-digit codes and bearer-token sessions, with rate limiting on the endpoints that need it. React + Vite up front, Express + SQLite behind.`,
    stack: ['React', 'Vite', 'Express', 'SQLite', 'Nodemailer'],
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
    detail: `Pillow Polygons turns a text prompt into low-poly geometric art. Describe what you want, pick which Claude model does the thinking -- Haiku, Sonnet, or Opus -- and it generates the piece as scalable SVG or a flat PNG.\n\nThe name is a Python joke: it runs on Pillow, the imaging library, not a soft furnishing. Hand it a reference image and it samples a palette straight off it, so the output matches whatever vibe you're chasing.\n\nHere's the actual trick: Claude doesn't return an image, it returns Python drawing code. A renderer runs that code against Pillow for the raster PNG and a parallel SVG recorder for the vector version, so one generation gives you matching PNG and SVG. Seeds make any result reproducible, and everything lands in a SQLite gallery with folders and tags.\n\nIt makes genuinely nice wallpapers. That's the entire pitch.`,
    stack: ['Python', 'Flask', 'Pillow', 'Anthropic API', 'SQLite'],
    links: [{ label: 'Live Site', url: 'https://poly.lab980.com' }]
  },
  {
    id: 'qa-ksink',
    tag: 'Web · Python · Test Automation',
    name: 'QA KSink',
    desc: "Two repos that only make sense together: a 'kitchen sink' demo app stuffed with every form, flow, and edge case worth testing, and a Playwright bot whose whole job is clicking through it. The dashboard streams the live browser as it works and files an HTML report.",
    status: 'active',
    statusText: 'Live (somehow)',
    detail: `QA KSink is two repos that only make sense together: a "kitchen sink" web app that exists purely to be the system under test, and a bot that exercises every scenario in it.\n\nThe target app is a React + Vite frontend over a FastAPI and SQLite backend -- forms, flows, auth, edge cases, and a documented scenario matrix of things that should (and pointedly should not) work. The bot drives it with Playwright under pytest, and instead of running headless it runs visible on purpose: the dashboard streams the live browser feed so you can actually watch it click through everything in real time, then spits out an HTML report of what passed and what didn't.\n\nThe dashboard itself is a small FastAPI service (/api/run, /api/status, /api/log) wrapped around the test run. The whole thing started as an excuse to practice test-automation tooling without a real app to break -- so building the breakable app became half the project.`,
    stack: ['Python', 'Playwright', 'Pytest', 'FastAPI', 'React'],
    links: [
      { label: 'Bot Dashboard', url: 'https://qa-bot.lab980.com' },
      { label: 'Target Site', url: 'https://qa-demo.lab980.com' }
    ]
  },
  {
    id: 'toulmin',
    tag: 'Web · Python · Education',
    name: 'Toulmin',
    desc: "An argument-diagramming tool built on Stephen Toulmin's model. Feed it a claim and it walks you through grounds, warrant, backing, qualifier, and rebuttal, shows a completeness meter for the parts you're dodging, and renders the whole thing as a proper diagram.",
    status: 'active',
    statusText: 'Live (somehow)',
    detail: `Toulmin is a small web app for building and visualizing arguments using Stephen Toulmin's model of argumentation -- the six-part structure debate students learn and everyone else argues without.\n\nYou break an argument into claim, grounds, warrant, backing, qualifier, and rebuttal. A completeness meter shows which parts you're still missing (the warrant, it's always the warrant), and the result renders as a proper Toulmin diagram with a print/PDF view.\n\nArguments export and import as JSON -- invalid items are skipped, not fatal -- and there's a seed CLI loaded with classic example arguments. Dark mode follows your system preference.\n\nUnder the hood: a single-file Flask app with SQLite and zero build step, tested with pytest for the API and a Playwright browser test that runs a full real-user flow against a throwaway database, across Python 3.9 through 3.12 in CI.`,
    stack: ['Python', 'Flask', 'SQLite', 'Vanilla JS'],
    links: [{ label: 'Build an Argument', url: 'https://toulmin.lab980.com' }]
  },
  {
    id: 'gigit',
    tag: 'SaaS · Next.js · Scheduling',
    name: 'Gigit',
    desc: 'Gig scheduling for talent agents with one hard rule: double-booking is impossible. A pure, unit-tested engine checks every confirmed booking across every agent -- timezone-aware, DST-correct -- before anything is allowed to land on a calendar.',
    status: 'wip',
    statusText: 'Built, not launched',
    detail: `Gigit is agent-first gig scheduling: talent agents book pros onto gigs, and the app's entire reason for existing is that it will not let two confirmed bookings overlap. Ever.\n\nThe scheduling engine is pure and unit-tested -- half-open interval overlap, absolute instants plus a per-gig IANA timezone so cross-timezone conflicts are caught DST-correctly. It checks all of a pro's confirmed bookings regardless of which agent owns the gig, but rival agents never see each other's business: foreign gigs are redacted down to "booked elsewhere," even inside the error messages.\n\nAround the engine: an openings board where pros raise their hand for roles, two-way iCalendar interop including a token-based subscription feed, bulk import from CSV, spreadsheets, or .ics, and a geocoding location picker that makes you choose a candidate instead of trusting the top match. Distances show in miles for US venues and km elsewhere, because details matter.\n\nFully built and running in the lab. Launching is a different project.`,
    stack: ['Next.js 15', 'TypeScript', 'Prisma', 'SQLite', 'Tailwind'],
    links: []
  },
  {
    id: 'boxo-show',
    tag: 'SaaS · Django · Stripe',
    name: 'Boxo.show',
    desc: 'White-label box office software. One Django deployment serves many branded theaters, each on its own subdomain: browse-to-buy Stripe checkout, emailed QR tickets, and an in-browser door scanner that can decode multiple tickets in a single camera frame.',
    status: 'wip',
    statusText: 'In development',
    detail: `Boxo.show is what happens after you rebuild two real theatre websites and realize every venue needs the same thing: a storefront, a checkout, and a way to scan tickets at the door.\n\nIt's a multi-tenant Django platform -- one deployment, many branded theaters. Tenants resolve from the subdomain, branding is per-tenant CSS custom properties, and staff roles are a cumulative hierarchy from owner down to scanner. The public side goes browse, buy, Stripe checkout, emailed QR ticket; the staff side manages events, orders, and the door.\n\nThe door scanner is the fun part: it runs in the browser and can pick apart multiple QR codes in one camera frame -- finder-pattern counting, overlapping-half decoding, analysis cropped to what's actually on screen. Nobody at a will-call table holds tickets up one at a time.\n\nIn active development. Not on the internet yet, on purpose.`,
    stack: ['Django', 'PostgreSQL', 'Stripe', 'Alpine.js'],
    links: []
  },
  {
    id: 'bonita',
    tag: 'Client · Static · Accessibility',
    name: 'Bonita Center for the Arts',
    desc: 'Real client work: migrating a 701-seat performing-arts theatre off Wix. Started with an accessibility audit of the live site -- 26 WCAG violations -- and rebuilt it as a dependency-free static site with zero trackers and a staff-editable events admin.',
    status: 'wip',
    statusText: 'Migration in progress',
    detail: `The Bonita Center for the Arts is a real 701-seat venue with a real website problem: a Wix site with 26 WCAG violations found by an axe-core audit -- unlabeled form fields, missing H1s, around forty misused heading tags.\n\nThe rebuild is deliberately boring in the best way: plain static HTML and CSS, no build step, no third-party requests, not even an external font (it's self-hosted). Shared page chrome is generated into partials and assembled by nginx server-side includes at request time.\n\nStaff get an events admin with live preview that saves straight to the site through a backend written in nothing but the Node standard library -- scrypt-hashed accounts, form intake, events storage. Structured data marks the venue up properly for search.\n\nThe audit tooling itself is part of the project: a headless-Chromium crawler running axe-core against every page, so "accessible" is a measured claim, not a vibe.`,
    stack: ['HTML/CSS', 'nginx SSI', 'Node (stdlib)', 'axe-core'],
    links: [{ label: 'Staging Rebuild', url: 'https://bonita.lab980.com' }]
  },
  {
    id: 'highlander',
    tag: 'Client · Static · Design',
    name: 'Highlander Auditorium',
    desc: "A truthful redesign for a 1,073-seat school-district auditorium. Every invented claim in the old copy got fact-checked out, the logo was reconstructed as a clean SVG from the venue's only raster file, and the palette was sampled from their actual stage-wash lighting.",
    status: 'wip',
    statusText: 'Redesign delivered',
    detail: `Highlander Auditorium is a 1,073-seat proscenium theatre run by a school district, and its redesign started with subtraction: content that couldn't be verified -- including an invented events season -- came out before anything new went in.\n\nWhat went in is fast and honest. Static multi-page HTML with no framework and no build step. Zero third-party requests except a map embed: even the weather widget is a custom UI hitting a keyless, CORS-friendly forecast API client-side, and it hides itself on failure so it can never look broken.\n\nThe design details were archaeology. The venue's logo existed only as a raster image, so it was reconstructed as a clean SVG. The accent color was sampled from photos of their actual stage-wash lighting. Fonts are self-hosted variable fonts, subset down to about 100KB total.\n\nDelivered as a complete handoff -- including an honest open-items list of everything still unverified, down to a ZIP code discrepancy.`,
    stack: ['HTML/CSS/JS', 'Open-Meteo', 'nginx'],
    links: []
  },
  {
    id: 'burner-map',
    tag: 'Maps · ???',
    name: 'Burner Map',
    desc: "A map app. For burners. It exists, it's in the lab, and that's all you're getting for now.",
    status: 'wip',
    statusText: 'Under wraps',
    detail: `There is a map. There are burners. The two are being introduced to each other in the lab right now.\n\nDetails when it's ready. Or when it isn't, which is also a proud lab980 tradition.`,
    stack: ['TBD'],
    links: []
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

// ─── RENDER HERO INDEX ────────────────────────────────────
function renderIndex() {
  const list = document.querySelector('.hero-index-list');
  const count = document.querySelector('.hero-index-count');
  if (!list) return;

  const pad = n => String(n).padStart(2, '0');
  if (count) count.textContent = pad(projects.length);

  list.innerHTML = projects.map((p, i) => `
    <li>
      <button class="hero-index-item" data-id="${p.id}" aria-label="View details for ${p.name}">
        <span class="idx-num">${pad(i + 1)}</span>
        <span class="idx-name">${p.name}</span>
        <span class="idx-dot ${p.status}"></span>
      </button>
    </li>
  `).join('');

  list.querySelectorAll('.hero-index-item').forEach(item => {
    item.addEventListener('click', () => scrollToCard(item.dataset.id));
  });
}

// ─── HERO INDEX -> CARD ───────────────────────────────────
function scrollToCard(id) {
  const card = document.querySelector(`.project-card[data-id="${id}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.remove('flash');
  // force reflow so the animation can retrigger on repeat clicks
  void card.offsetWidth;
  card.classList.add('flash');
  card.addEventListener('animationend', () => card.classList.remove('flash'), { once: true });
}

// ─── STARFIELD (parallax, reduced-motion aware) ───────────
function initStarfield() {
  const canvas = document.querySelector('.starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // The canvas itself scrolls with the hero at 1x, so `speed` is the fraction
  // of scroll the stars LAG by: on-screen they drift at (1 - speed)x. These
  // values land the field around half the page's scroll speed, slower for the
  // smaller/more-distant layers. Alphas stay low so it never fights the text.
  const LAYERS = [
    { speed: 0.62, size: 0.6, alpha: 0.16, weight: 0.46 }, // faint dust — keeps it subtle
    { speed: 0.52, size: 0.9, alpha: 0.36, weight: 0.30 }, // mid
    { speed: 0.42, size: 1.3, alpha: 0.72, weight: 0.16 }, // bright
    { speed: 0.36, size: 1.7, alpha: 0.98, weight: 0.08 }  // standouts — these pop
  ];

  let W = 0, H = 0, stars = [], lastW = -1;

  function sizeCanvas() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#F0EDE8';
  }

  function generate() {
    const density = (W * H) / 900; // dense field
    stars = [];
    for (const layer of LAYERS) {
      const n = Math.round(density * layer.weight);
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: layer.size * (0.6 + Math.random() * 0.8),
          a: layer.alpha * (0.5 + Math.random() * 0.5),
          speed: layer.speed
        });
      }
    }
  }

  function build() {
    sizeCanvas();
    generate();
    lastW = W;
  }

  function draw() {
    const scrollY = reduce ? 0 : (window.scrollY || 0);
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      // ADD a fraction of scroll (canvas already moves 1x with the hero), so
      // stars net out slower than the page. Positive-modulo wrap keeps y in
      // [0, H) even when scrollY is negative (iOS rubber-band at the top).
      const y = (((s.y + scrollY * s.speed) % H) + H) % H;
      ctx.globalAlpha = s.a;
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  build();
  draw();

  if (!reduce) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { draw(); ticking = false; });
    }, { passive: true });
  }

  // Only regenerate when the WIDTH changes. Mobile browsers fire resize on
  // vertical scroll (the URL bar collapsing changes viewport height), and
  // rebuilding there is what made the field "randomize" near the top.
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = canvas.clientWidth;
      sizeCanvas();
      if (w !== lastW) { generate(); lastW = w; }
      draw();
    }, 150);
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
  renderIndex();
  initStarfield();

  const modal = document.getElementById('project-modal');
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
});
