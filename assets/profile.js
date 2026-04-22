// ============================================================
// Borealis Reptiles — Animal profile page
// ============================================================
import { data } from './data.js';

const $  = (s, r = document) => r.querySelector(s);

function toast(msg, kind = 'ok') {
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'error' ? ' error' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function placeholderImg(name = '') {
  const initial = (name || '?')[0].toUpperCase();
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#cde3d6'/><stop offset='1' stop-color='#3f8c69'/></linearGradient></defs>
      <rect width='400' height='400' fill='url(#g)'/>
      <text x='50%' y='55%' text-anchor='middle' font-family='Georgia,serif' font-size='220' fill='#0f241c' opacity='.55'>${initial}</text>
    </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function miniCard(animal, role) {
  if (!animal) return '';
  const img = animal.image_url || placeholderImg(animal.name || animal.code || animal.gene);
  return `
    <a class="mini-card" href="profile.html?id=${animal.id}">
      <img src="${img}" alt="${animal.name || animal.code || ''}" onerror="this.src='${placeholderImg(animal.name)}'">
      <div>
        <div class="role">${role}</div>
        <div class="nm">${animal.name || animal.code || '—'}</div>
        <div class="muted" style="font-size:.85rem">${animal.gene || ''}</div>
      </div>
    </a>`;
}

function offspringCard(a) {
  const isSold = a.status === 'sold';
  const statusLabel = {
    available: 'Available', reserved: 'Reserved', sold: 'Sold',
    not_for_sale: 'Not for sale', breeder: 'Breeder',
  }[a.status] || a.status;
  const price = a.price ? `$${Number(a.price).toLocaleString()}` : (a.status === 'breeder' ? 'Breeder' : '—');
  const img = a.image_url || placeholderImg(a.code || a.gene);
  return `
    <a class="animal-card ${isSold ? 'sold' : ''}" href="profile.html?id=${a.id}">
      <div class="thumb"><img src="${img}" alt="${a.gene || a.code}" onerror="this.src='${placeholderImg(a.gene)}'"></div>
      <div class="body">
        <div class="code">${a.code || a.species || ''}</div>
        <div class="gene">${a.gene || a.name || 'Reptile'}</div>
        <div class="row">
          <span class="price-tag">${price}</span>
          <span class="status-pill status-${a.status}">${statusLabel}</span>
        </div>
      </div>
    </a>`;
}

function statusPill(status) {
  const label = { available:'Available', reserved:'Reserved', sold:'Sold',
    not_for_sale:'Not for sale', breeder:'Breeder' }[status] || status || '—';
  return `<span class="status-pill status-${status || ''}">${label}</span>`;
}

async function load() {
  const id = new URLSearchParams(location.search).get('id');
  const root = $('#profileRoot');
  if (!id) { root.innerHTML = `<div class="empty">No animal id in URL.</div>`; return; }

  try {
    const { animal, parents, offspring } = await data.getAnimal(id);
    if (!animal) { root.innerHTML = `<div class="empty">Animal not found.</div>`; return; }
    document.title = `${animal.name || animal.code || 'Animal'} — Borealis Reptiles`;

    const mainImg = animal.image_url || placeholderImg(animal.name || animal.code);
    const title = animal.name || animal.code || animal.gene || 'Reptile';
    const sub = [animal.species, animal.gene].filter(Boolean).join(' · ') || animal.category;
    const price = animal.price ? `$${Number(animal.price).toLocaleString()}` : '—';
    const canBuy = animal.status === 'available' && animal.price;

    root.innerHTML = `
      <section class="profile">
        <div class="profile-gallery">
          <img src="${mainImg}" alt="${title}" onerror="this.src='${placeholderImg(title)}'">
        </div>
        <div class="profile-meta">
          <span class="eyebrow">${animal.category || 'Reptile'}${animal.code ? ' · ' + animal.code : ''}</span>
          <h1>${title}</h1>
          <div class="sub">${sub}</div>
          <div>${statusPill(animal.status)}</div>

          <div class="profile-stats">
            <div class="stat"><div class="label">Species</div><div class="value">${animal.species || '—'}</div></div>
            <div class="stat"><div class="label">Gene / morph</div><div class="value">${animal.gene || '—'}</div></div>
            <div class="stat"><div class="label">Sex</div><div class="value">${animal.sex ? animal.sex.charAt(0).toUpperCase()+animal.sex.slice(1) : '—'}</div></div>
            <div class="stat"><div class="label">Weight</div><div class="value">${animal.weight || '—'}</div></div>
            <div class="stat"><div class="label">Born</div><div class="value">${animal.birth_date || '—'}</div></div>
            <div class="stat"><div class="label">Price</div><div class="value">${price}</div></div>
          </div>

          ${animal.description ? `<p>${animal.description}</p>` : ''}

          <div class="profile-actions">
            <button id="buyBtn" class="btn btn-accent" ${canBuy ? '' : 'disabled'}>
              <i class="fas fa-handshake"></i> ${canBuy ? 'Request to buy' : (animal.status === 'sold' ? 'Sold' : 'Not available')}
            </button>
            <a class="btn btn-ghost" href="index.html#contact"><i class="fas fa-envelope"></i> Ask a question</a>
          </div>

          ${(parents.mother || parents.father) ? `
            <div>
              <span class="eyebrow" style="margin-top:1.5rem;display:inline-block">Parents</span>
              <div class="parents-bar">
                ${miniCard(parents.father, '♂ Sire')}
                ${miniCard(parents.mother, '♀ Dam')}
              </div>
            </div>
          ` : ''}
        </div>
      </section>

      ${offspring.length ? `
        <section class="section" style="padding-top:2rem">
          <span class="eyebrow">Offspring</span>
          <h2>Known offspring</h2>
          <div class="animal-grid">
            ${offspring.map(offspringCard).join('')}
          </div>
        </section>
      ` : ''}
    `;

    // wire up buy modal
    const buyBtn = $('#buyBtn');
    buyBtn?.addEventListener('click', () => openBuyModal(animal));
  } catch (e) {
    console.error(e);
    root.innerHTML = `<div class="empty">Couldn't load profile.</div>`;
  }
}

function openBuyModal(animal) {
  const modal = $('#buyModal');
  $('#buyTitle').textContent = `Request to buy ${animal.name || animal.code || 'this animal'}`;
  modal.classList.add('open');
  modal._animal = animal;
}

function initBuyModal() {
  const modal = $('#buyModal');
  modal?.addEventListener('click', (e) => {
    if (e.target === modal || e.target.matches('[data-close]')) modal.classList.remove('open');
  });
  $('#buyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const animal = modal._animal;
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.inquiry_type = 'buy';
    payload.animal_id = animal.id;
    payload.animal_code = animal.code || null;
    if (!payload.message) payload.message = `Request for ${animal.name || animal.code} (${animal.gene || ''})`;

    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    try {
      await data.createRequest(payload);
      modal.classList.remove('open');
      toast('Request submitted — we\'ll be in touch!');

      // Also open the user's email client as a backup
      const subject = encodeURIComponent(`Buy request: ${animal.code || animal.name || 'animal'}`);
      const body = encodeURIComponent(
        `Hi Borealis Reptiles,\n\nI'd like to request: ${animal.name || animal.code || '—'} (${animal.gene || ''}).\n\n` +
        `Name: ${payload.customer_name}\nEmail: ${payload.customer_email}\nPhone: ${payload.customer_phone || ''}\n` +
        `Ship to: ${payload.shipping_address}\n\nNotes: ${payload.message}\n`
      );
      window.location.href = `mailto:info@borealisreptiles.com?subject=${subject}&body=${body}`;
      e.target.reset();
    } catch (err) {
      toast('Failed: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit request';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initBuyModal();
  load();
});
