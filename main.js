const projects = [
  {
    id: 'capcrop',
    tag: 'SaaS · Python · AI',
    name: 'CapCrop',
    desc: 'Batch photo digitization as a product: drop in a flatbed scan of several prints and get each one auto-cropped, straightened, restored, and tagged. "Rescue every photo from the scanner bed."',
    status: 'wip',
    statusText: 'Private beta -- 2026',
    detail: `CapCrop turns a shoebox of old prints into an organized digital archive. Drop in a flatbed scan holding several photos and it extracts each one by bounding box, straightens it, and cleans it up -- fading, dust, and scratch removal, plus color-negative inversion for film.\n\nAI handles caption and tag suggestions on demand, and you can bring your own API key. Everything exports as organized, fully-backed-up ZIPs sorted into folders. Photos are never used to train anything, and you can export or delete all of your data at any time.\n\nThe product grew out of Photo Studio, an earlier self-hosted MVP that proved the problem was worth solving. CapCrop is that idea rebuilt as a real product on the same computer-vision foundation, with its own domain and a clear promise: rescue every photo from the scanner bed.\n\nCapCrop is in private beta for 2026, with early-access signups open now.`,
    stack: ['Python', 'Flask', 'OpenCV', 'AI Restoration', 'HTML/CSS/JS'],
    links: [{ label: 'Early Access', url: 'https://capcrop.com' }]
  },
  {
    id: 'boxo-show',
    tag: 'SaaS · Django · Stripe',
    name: 'Boxo.show',
    desc: 'White-label box office: one deployment, many independently branded theaters -- storefront, Stripe checkout, emailed QR tickets, and a door scanner that reads several tickets in a single camera frame.',
    status: 'wip',
    statusText: 'In active development',
    detail: `Boxo.show is a multi-tenant ticketing platform for live venues: one deployment serving many independently branded theaters. Tenants resolve from the subdomain, branding is per-tenant, and staff roles form a cumulative hierarchy from owner down to door scanner.\n\nThe public side runs browse, buy, Stripe checkout, and an emailed QR ticket. The staff side manages events, orders, and the door. Each venue keeps its own catalog, orders, and branding fully isolated from every other tenant on the platform.\n\nThe door scanner runs entirely in the browser and can decode multiple QR codes in a single camera frame -- finder-pattern counting, overlapping-half decoding, and analysis cropped to what's actually on screen -- so a will-call table isn't scanning tickets one at a time.\n\nBoxo.show is in active development, built on the experience of shipping two production theatre sites.`,
    stack: ['Django', 'PostgreSQL', 'Stripe', 'Alpine.js'],
    links: []
  },
  {
    id: 'fec-platform',
    tag: 'SaaS · Multi-tenant · White-label',
    name: 'FEC Platform',
    desc: 'A multi-tenant, white-label platform for family entertainment centers: one deployment serving many independently branded operators, each on their own subdomain.',
    status: 'active',
    statusText: 'Live',
    detail: `FEC Platform is a white-label web platform for family entertainment centers -- arcades, activity parks, and the mixed-attraction venues in between. It runs as a single multi-tenant deployment that serves many operators, each as an independently branded tenant.\n\nTenants resolve from their own subdomain, and every operator gets its own branding while sharing one codebase and one deployment. Adding a venue is an onboarding step, not a new build, so the platform scales across operators without forking per venue.\n\nThe multi-tenant, white-label architecture keeps each operator's presence fully separated while a single team maintains one system underneath.\n\nFEC Platform is live in production.`,
    stack: ['Multi-tenant', 'White-label', 'Web Platform'],
    links: [{ label: 'Live Site', url: 'https://ffc.lab980.com' }]
  },
  {
    id: 'gigit',
    tag: 'SaaS · Next.js · Scheduling',
    name: 'Gigit',
    desc: 'Agent-first gig scheduling with one guarantee: two confirmed bookings can never overlap. A pure, unit-tested engine enforces it across agents and timezones.',
    status: 'wip',
    statusText: 'Built -- pre-launch',
    detail: `Gigit is scheduling software for talent agents booking professionals onto gigs. Its core guarantee is simple and absolute: two confirmed bookings for the same pro can never overlap.\n\nThe scheduling engine is pure and unit-tested -- half-open interval overlap on absolute instants, with a per-gig IANA timezone so cross-timezone conflicts are caught DST-correctly. It checks all of a pro's confirmed bookings regardless of which agent owns the gig, while keeping agents isolated from one another: a rival's gigs are redacted to "booked elsewhere," even inside error messages.\n\nAround the engine sit an openings board where pros raise their hand for roles, two-way iCalendar interop including a token-based subscription feed, bulk import from CSV, spreadsheets, or .ics, and a geocoding location picker that requires choosing a specific candidate rather than trusting the top match. Distances render in miles for US venues and kilometers elsewhere.\n\nGigit is fully built and running, ahead of a public launch.`,
    stack: ['Next.js 15', 'TypeScript', 'Prisma', 'SQLite', 'Tailwind'],
    links: []
  },
  {
    id: 'artificial-atheist',
    tag: 'AI · Eleventy · Autonomous',
    name: 'Artificial Atheist',
    desc: 'A self-operating publication on atheism, skepticism, and critical thinking: an autonomous AI pipeline picks a topic, writes the article, illustrates it, and ships it -- no human in the loop.',
    status: 'active',
    statusText: 'Live -- self-publishing',
    detail: `Artificial Atheist is an AI-authored publication on atheism, skepticism, and critical thinking, and its entire editorial pipeline runs as a scheduled GitHub Action.\n\nOn a recurring schedule, the generator inventories what has already been published, selects the least-covered topic, and commissions an article with a genuinely new angle -- titles are deduplicated against the archive. It generates an accompanying illustration and commits Markdown, which triggers a static rebuild that puts the piece live, end to end, with no manual step.\n\nA local human-in-the-loop studio is available for steering an article from a seed idea, and an A/B harness runs the same prompt across multiple AI providers to compare latency and output -- the generator itself is provider-agnostic.\n\nThe brand also spans AtheismIQ, a shareable knowledge quiz that places players on the belief/knowledge axes and scores them against the concepts people most often get wrong -- now part of the Artificial Atheist property.`,
    stack: ['Eleventy', 'Node', 'Claude API', 'OpenAI Images', 'GitHub Actions'],
    links: [{ label: 'Read It', url: 'https://artificialatheist.com' }]
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
document.querySelector('.cta-primary').addEventListener('click', function(e) {
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
