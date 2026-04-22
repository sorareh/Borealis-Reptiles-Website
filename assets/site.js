// ============================================================
// Borealis Reptiles — public site behavior
// Loads breeding pairs, renders them, handles modal + contact form.
// ============================================================
import { data } from './data.js';

// -------- tiny DOM helpers --------
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// -------- toast --------
function toast(msg, kind = 'ok') {
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'error' ? ' error' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// -------- nav --------
function initNav() {
  const ham = $('#hamburger');
  const links = $('#navLinks');
  ham?.addEventListener('click', () => links.classList.toggle('open'));

  $$('.nav-link').forEach(a => {
    a.addEventListener('click', (e) => {
      const sec = a.getAttribute('data-section');
      if (!sec) return;
      e.preventDefault();
      $$('.nav-link').forEach(l => l.classList.remove('active'));
      a.classList.add('active');
      const target = document.getElementById(sec);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      links.classList.remove('open');
    });
  });

  // Highlight nav as user scrolls.
  const sections = ['home','pairs','merch','care','about','contact'];
  const io = new IntersectionObserver((entries) => {
    for (const ent of entries) {
      if (ent.isIntersecting) {
        const id = ent.target.id;
        $$('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.section === id));
      }
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
}

// -------- pairs rendering --------
function placeholderImg(name = '') {
  // tiny inline SVG placeholder tinted with forest hue
  const initial = (name || '?')[0].toUpperCase();
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#cde3d6'/><stop offset='1' stop-color='#3f8c69'/></linearGradient></defs>
      <rect width='200' height='200' fill='url(#g)'/>
      <text x='50%' y='55%' text-anchor='middle' font-family='Georgia,serif' font-size='90' fill='#0f241c' opacity='.6'>${initial}</text>
    </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function pairCard(p) {
  const maleSrc   = p.male_image   || placeholderImg(p.male_name);
  const femaleSrc = p.female_image || placeholderImg(p.female_name);
  const title = p.title || `${p.male_name || '?'} × ${p.female_name || '?'}`;
  const genes = [p.male_gene, p.female_gene].filter(Boolean).join(' × ') || (p.description || '');
  return `
    <article class="pair-card" data-pair-id="${p.id}">
      <div class="pair-media">
        <div class="parent-tile">
          <img src="${maleSrc}" alt="${p.male_name || 'Male'}" onerror="this.src='${placeholderImg(p.male_name)}'">
          <span class="tile-label">♂ ${p.male_name || 'Male'}</span>
        </div>
        <div class="pair-heart"><i class="fas fa-heart"></i></div>
        <div class="parent-tile">
          <img src="${femaleSrc}" alt="${p.female_name || 'Female'}" onerror="this.src='${placeholderImg(p.female_name)}'">
          <span class="tile-label">♀ ${p.female_name || 'Female'}</span>
        </div>
      </div>
      <div class="pair-body">
        <div class="pair-title">${title}</div>
        <div class="pair-genes">${genes || 'Breeding pair'}</div>
        <div class="pair-foot">
          <span class="count"><i class="fas fa-egg"></i> ${p.offspring_count || 0} offspring</span>
          <span>View clutch →</span>
        </div>
      </div>
    </article>
  `;
}

async function loadPairs() {
  const grid = $('#pairsGrid');
  const viewAllBtn = $('#viewAllPairsBtn');
  try {
    const pairs = await data.listPairs();
    window._pairsCache = pairs;
    if (!pairs.length) {
      grid.innerHTML = `<div class="empty">No breeding pairs yet. <a href="admin.html">Add some in admin →</a></div>`;
      if (viewAllBtn) viewAllBtn.style.display = 'none';
      return;
    }
    const homepagePairs = pairs.slice(0, 6);
    grid.innerHTML = homepagePairs.map(pairCard).join('');
    if (viewAllBtn) viewAllBtn.style.display = pairs.length > 6 ? 'inline-flex' : 'none';
    grid.addEventListener('click', onPairClick);
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<div class="empty">Couldn't load pairs. Check console.</div>`;
    if (viewAllBtn) viewAllBtn.style.display = 'none';
  }
}

// -------- modal: pair offspring --------
function animalCard(a) {
  const isSold = a.status === 'sold';
  const statusLabel = {
    available: 'Available',
    reserved:  'Reserved',
    sold:      'Sold',
    not_for_sale: 'Not for sale',
    breeder:   'Breeder',
  }[a.status] || a.status;
  const price = a.price ? `$${Number(a.price).toLocaleString()}` : (a.status === 'breeder' ? 'Breeder' : '—');
  const img = a.image_url || placeholderImg(a.code || a.name || a.gene);
  return `
    <a class="animal-card ${isSold ? 'sold' : ''}" href="profile.html?id=${a.id}">
      <div class="thumb"><img src="${img}" alt="${a.gene || a.name || a.code}" onerror="this.src='${placeholderImg(a.code || a.gene)}'"></div>
      <div class="body">
        <div class="code">${a.code || (a.species || '')}</div>
        <div class="gene">${a.gene || a.name || 'Reptile'}</div>
        <div class="row">
          <span class="price-tag">${price}</span>
          <span class="status-pill status-${a.status}">${statusLabel}</span>
        </div>
      </div>
    </a>
  `;
}

async function openPairModal(pairId) {
  const { pair, offspring } = await data.getPair(pairId);
  const modal = $('#pairModal');
  $('#pairEyebrow').textContent = 'Clutch';
  $('#pairTitle').textContent = pair.title || `${pair.male_name || '?'} × ${pair.female_name || '?'}`;
  $('#pairSub').textContent = [pair.male_gene, pair.female_gene].filter(Boolean).join(' × ') || (pair.description || '');
  const grid = $('#pairOffspringGrid');
  if (!offspring.length) {
    grid.innerHTML = `<div class="empty">No offspring listed yet.</div>`;
  } else {
    grid.innerHTML = offspring.map(animalCard).join('');
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function onPairClick(e) {
  const card = e.target.closest('.pair-card');
  if (!card) return;
  const id = card.dataset.pairId;
  openPairModal(id);
}

function openViewAllPairs() {
  const grid = $('#pairsAllGrid');
  const all = window._pairsCache || [];
  grid.innerHTML = all.length ? all.map(pairCard).join('') : `<div class="empty">No breeding pairs yet.</div>`;
  grid.addEventListener('click', onPairClick, { once: false });
  $('#pairsModal').classList.add('open');
}

function initModal() {
  // Close on overlay click / [data-close] / Escape, for every modal on the page.
  $$('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('[data-close]')) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $$('.modal.open').forEach(m => m.classList.remove('open'));
  });
}

// ============================================================
// Merchandise
// ============================================================
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function typeLabel(t) {
  if (!t) return 'Piece';
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function merchCard(m) {
  const img = m.image_url || placeholderImg(m.name);
  const price = m.price != null ? `$${Number(m.price).toFixed(2)}` : 'Enquire';
  const shed = m.shed_source ? `<div class="meta">From <strong>${escapeHtml(m.shed_source)}</strong>'s shed · ${escapeHtml(m.material || '')}</div>` : (m.material ? `<div class="meta">${escapeHtml(m.material)}</div>` : '');
  const isSold = m.status === 'sold';
  return `
    <article class="merch-card ${isSold ? 'sold' : ''}" data-merch-id="${m.id}">
      <div class="thumb"><img src="${img}" alt="${escapeHtml(m.name)}" onerror="this.src='${placeholderImg(m.name)}'"></div>
      <div class="body">
        <span class="type-pill">${typeLabel(m.type)}</span>
        <div class="title">${escapeHtml(m.name)}</div>
        ${shed}
        <div class="row">
          <span class="price-tag">${price}</span>
          <span class="status-pill status-${m.status}">${isSold ? 'Sold' : (m.status || 'available')}</span>
        </div>
      </div>
    </article>
  `;
}

async function loadMerchandise() {
  const featuredGrid = $('#merchFeatured');
  try {
    const all = await data.listMerchandise();
    window._merchCache = all;
    const featured = all.filter(m => Number(m.featured) === 1);
    const display = (featured.length ? featured : all).slice(0, 3);
    if (!display.length) {
      featuredGrid.innerHTML = `<div class="empty">No merchandise yet.</div>`;
    } else {
      featuredGrid.innerHTML = display.map(merchCard).join('');
    }
    featuredGrid.addEventListener('click', onMerchClick);
  } catch (e) {
    console.error(e);
    featuredGrid.innerHTML = `<div class="empty">Couldn't load merchandise.</div>`;
  }
}

function onMerchClick(e) {
  const card = e.target.closest('.merch-card');
  if (!card) return;
  openMerchDetail(Number(card.dataset.merchId));
}

function openMerchDetail(id) {
  const m = (window._merchCache || []).find(x => x.id === id);
  if (!m) return;
  const img = m.image_url || placeholderImg(m.name);
  const price = m.price != null ? `$${Number(m.price).toFixed(2)}` : 'Enquire';
  $('#merchDetailEyebrow').textContent = typeLabel(m.type);

  const canBuy = m.status === 'available' && m.price;
  $('#merchDetailBody').innerHTML = `
    <div class="merch-detail">
      <img src="${img}" alt="${escapeHtml(m.name)}" onerror="this.src='${placeholderImg(m.name)}'">
      <div>
        <h2 style="margin-top:0">${escapeHtml(m.name)}</h2>
        <p class="muted">${m.code ? escapeHtml(m.code) + ' · ' : ''}<span class="status-pill status-${m.status}">${m.status || 'available'}</span></p>
        <dl class="kv">
          <dt>Type</dt>        <dd>${typeLabel(m.type)}</dd>
          ${m.material    ? `<dt>Material</dt>    <dd>${escapeHtml(m.material)}</dd>`     : ''}
          ${m.shed_source ? `<dt>Shed from</dt>   <dd><strong>${escapeHtml(m.shed_source)}</strong></dd>` : ''}
          <dt>Price</dt>       <dd><strong>${price}</strong></dd>
        </dl>
        ${m.description ? `<p>${escapeHtml(m.description)}</p>` : ''}
        <div style="display:flex;gap:.6rem;margin-top:1rem;flex-wrap:wrap;">
          <button class="btn btn-accent" id="merchBuyBtn" ${canBuy ? '' : 'disabled'}>
            <i class="fas fa-handshake"></i> ${canBuy ? 'Enquire / buy' : (m.status === 'sold' ? 'Sold' : 'Enquire')}
          </button>
          <button class="btn btn-ghost" data-close>Close</button>
        </div>
      </div>
    </div>
  `;
  $('#merchDetailModal').classList.add('open');

  const buy = $('#merchBuyBtn');
  buy?.addEventListener('click', () => {
    $('#merchDetailModal').classList.remove('open');
    const msg = `I'd love to enquire about "${m.name}" (${m.code || '#' + m.id}).`;
    $('#inquiryType').value = 'buy';
    $('#snakeCode').value   = m.code || '';
    $('#message').value     = msg;
    $('#addressField').style.display = 'block';
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
  });
}

function openViewAllMerch() {
  const grid = $('#merchAllGrid');
  const all = window._merchCache || [];
  grid.innerHTML = all.length ? all.map(merchCard).join('') : `<div class="empty">No merchandise yet.</div>`;
  grid.addEventListener('click', onMerchClick, { once: false });
  $('#merchModal').classList.add('open');
}

// ============================================================
// Care sheets
// ============================================================
function careCard(c) {
  return `
    <article class="care-card" data-care-id="${c.id}">
      <i class="fas fa-chevron-down chev"></i>
      <h3>${escapeHtml(c.title)}</h3>
      ${c.summary ? `<p class="summary">${escapeHtml(c.summary)}</p>` : ''}
      <div class="body">${escapeHtml(c.content || '')}</div>
    </article>
  `;
}

async function loadCareSheets() {
  const grid = $('#careGrid');
  try {
    const sheets = await data.listCareSheets();
    if (!sheets.length) {
      grid.innerHTML = `<div class="empty">No care sheets yet. <a href="admin.html">Add some in admin →</a></div>`;
      return;
    }
    grid.innerHTML = sheets.map(careCard).join('');
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.care-card');
      if (!card) return;
      card.classList.toggle('open');
    });
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<div class="empty">Couldn't load care sheets.</div>`;
  }
}

// -------- contact form --------
function initContact() {
  const form = $('#contactForm');
  const typeEl = $('#inquiryType');
  const addressField = $('#addressField');
  const codeField = $('#codeField');

  typeEl?.addEventListener('change', () => {
    const buying = typeEl.value === 'buy';
    addressField.style.display = buying ? 'block' : 'none';
    codeField.style.display    = buying ? 'block' : 'block';
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    try {
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      await data.createRequest(payload);
      form.reset();
      addressField.style.display = 'none';
      toast('Message sent — we\'ll be in touch!');
    } catch (err) {
      console.error(err);
      toast('Could not send: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send message';
    }
  });
}

// -------- boot --------
document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initModal();
  initContact();
  $('#viewAllPairsBtn')?.addEventListener('click', openViewAllPairs);
  $('#viewAllMerchBtn')?.addEventListener('click', openViewAllMerch);
  await Promise.all([loadPairs(), loadMerchandise(), loadCareSheets()]);

  // Pre-fill a buy request if arriving via ?buy=CODE
  const p = new URLSearchParams(location.search);
  if (p.has('buy')) {
    $('#inquiryType').value = 'buy';
    $('#snakeCode').value   = p.get('buy');
    $('#addressField').style.display = 'block';
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
  }
});
