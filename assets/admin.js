// ============================================================
// Borealis Reptiles — Admin panel
// Full CRUD for animals, breeding pairs and purchase requests.
// ============================================================
import { data } from './data.js';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------- toast ----------
function toast(msg, kind = 'ok') {
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'error' ? ' error' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ---------- boot ----------
document.addEventListener('DOMContentLoaded', async () => {
  await updateEnvBadge();

  const authed = await data.isAuthed();
  if (authed) showAdmin(); else showLogin();

  $('#loginForm').addEventListener('submit', onLogin);
  $('#logoutBtn').addEventListener('click', onLogout);
  $$('#adminNav a').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    const v = a.getAttribute('data-view');
    switchView(v);
  }));
  $$('[data-go]').forEach(b => b.addEventListener('click', () => switchView(b.dataset.go)));
  $('#resetDemoBtn').addEventListener('click', onResetDemo);

  $('#animalForm').addEventListener('submit', onAnimalSubmit);
  $('#animalResetBtn').addEventListener('click', resetAnimalForm);
  $('#animalRoleFilter').addEventListener('change', renderAnimalsTable);
  $('#animalStatusFilter').addEventListener('change', renderAnimalsTable);

  $('#pairForm').addEventListener('submit', onPairSubmit);
  $('#pairResetBtn').addEventListener('click', resetPairForm);

  $('#merchForm').addEventListener('submit', onMerchSubmit);
  $('#merchResetBtn').addEventListener('click', resetMerchForm);
  $('#animalImageUploadBtn').addEventListener('click', onAnimalImageUpload);
  $('#animalImageClearBtn').addEventListener('click', onAnimalImageClear);
  $('#merchImageUploadBtn').addEventListener('click', onMerchImageUpload);
  $('#merchImageClearBtn').addEventListener('click', onMerchImageClear);

  $('#careForm').addEventListener('submit', onCareSubmit);
  $('#careResetBtn').addEventListener('click', resetCareForm);
});

// ---------- env badge ----------
async function updateEnvBadge() {
  const mode = await data.mode();
  const badge = $('#envBadge');
  const note  = $('#envNote');
  if (mode === 'local') {
    if (badge) { badge.className = 'env-badge local'; badge.textContent = 'Local demo (browser)'; }
    if (note)  note.innerHTML = 'Running locally — data is stored in your browser. Default password is <code>duncan</code>.';
  } else {
    if (badge) { badge.className = 'env-badge remote'; badge.textContent = 'Cloudflare D1'; }
    if (note)  note.textContent = 'Connected to Cloudflare backend.';
  }
}

// ---------- auth ----------
async function onLogin(e) {
  e.preventDefault();
  const err = $('#loginError');
  err.style.display = 'none';
  const pw = $('#pw').value;
  const ok = await data.login(pw);
  if (ok) { showAdmin(); }
  else { err.textContent = 'Incorrect password.'; err.style.display = 'block'; $('#pw').value = ''; }
}
async function onLogout() {
  await data.logout();
  showLogin();
}
async function showLogin() {
  $('#loginShell').classList.remove('hidden');
  $('#adminShell').classList.add('hidden');
}
async function showAdmin() {
  $('#loginShell').classList.add('hidden');
  $('#adminShell').classList.remove('hidden');
  await refreshAll();
  // honor hash
  const v = (location.hash || '#dashboard').replace('#','');
  switchView(v);
}

// ---------- caches ----------
let cacheAnimals = [];
let cachePairs   = [];
let cacheReqs    = [];
let cacheMerch   = [];
let cacheCare    = [];

async function refreshAll() {
  await Promise.all([refreshAnimals(), refreshPairs(), refreshRequests(), refreshMerch(), refreshCare()]);
  renderDashboard();
  renderAnimalsTable();
  renderPairsTable();
  renderRequestsTable();
  renderMerchTable();
  renderCareTable();
  renderTree();
  populateAnimalParentSelects();
  populatePairSelects();
}
async function refreshAnimals() { cacheAnimals = await data.listAnimals(); }
async function refreshPairs()   { cachePairs   = await data.listPairs(); }
async function refreshRequests(){ cacheReqs    = await data.listRequests(); }
async function refreshMerch()   { cacheMerch   = await data.listMerchandise(); }
async function refreshCare()    { cacheCare    = await data.listCareSheets(); }

// ---------- view switching ----------
function switchView(name) {
  $$('.view').forEach(v => v.classList.add('hidden'));
  $('#view-' + name)?.classList.remove('hidden');
  $$('#adminNav a').forEach(a => a.classList.toggle('active', a.dataset.view === name));
  const titles = {
    dashboard: ['Dashboard', 'An overview of your reptile collection and recent activity.'],
    animals:   ['Animals', 'Add, edit and manage every reptile in your collection.'],
    pairs:     ['Breeding pairs', 'Explicit pairings shown on the public Collection page.'],
    merch:     ['Merchandise', 'Jewelry and goods handmade by Sara — the "Merch" section of the site.'],
    care:      ['Care sheets', 'Editable husbandry guides shown on the homepage.'],
    requests:  ['Purchase requests', 'Buy requests and general inquiries submitted on the site.'],
    tree:      ['Family tree', 'All breeding pairs and their offspring at a glance.'],
  }[name] || [name, ''];
  $('#viewTitle').textContent = titles[0];
  $('#viewSub').textContent   = titles[1];
  location.hash = name;
}

// ---------- dashboard ----------
function renderDashboard() {
  const total = cacheAnimals.length;
  const available = cacheAnimals.filter(a => a.status === 'available').length;
  const sold      = cacheAnimals.filter(a => a.status === 'sold').length;
  const breeders  = cacheAnimals.filter(a => a.role === 'breeder').length;
  const newReqs   = cacheReqs.filter(r => r.status === 'new').length;
  const pairs     = cachePairs.length;
  const merchCount = cacheMerch.length;
  const merchAvail = cacheMerch.filter(m => m.status === 'available').length;
  const careCount  = cacheCare.length;
  $('#kpiGrid').innerHTML = [
    ['Animals', total],
    ['Available', available],
    ['Breeders', breeders],
    ['Breeding pairs', pairs],
    ['Sold', sold],
    ['New requests', newReqs],
    ['Merchandise', `${merchAvail}/${merchCount}`],
    ['Care sheets', careCount],
  ].map(([l,v]) => `<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div></div>`).join('');

  const recent = cacheReqs.slice(0, 5);
  $('#dashRequests').innerHTML = recent.length
    ? requestsTableHtml(recent)
    : `<div class="empty">No requests yet.</div>`;
  bindRequestRowActions();
}

// ---------- animals ----------
function animalLabel(a) {
  if (a.role === 'breeder') return `${a.name || '?'} — ${a.gene || ''} (${a.sex || '?'})`;
  return `${a.code || a.gene || '?'} — ${a.gene || ''}`;
}

function populateAnimalParentSelects() {
  const breeders = cacheAnimals.filter(a => a.role === 'breeder');
  const fathers = breeders.filter(a => a.sex === 'male');
  const mothers = breeders.filter(a => a.sex === 'female');
  const fSel = $('#animalForm select[name=father_id]');
  const mSel = $('#animalForm select[name=mother_id]');
  fSel.innerHTML = '<option value="">—</option>' + fathers.map(a => `<option value="${a.id}">${a.name || a.code}</option>`).join('');
  mSel.innerHTML = '<option value="">—</option>' + mothers.map(a => `<option value="${a.id}">${a.name || a.code}</option>`).join('');
}

function populatePairSelects() {
  const breeders = cacheAnimals.filter(a => a.role === 'breeder');
  const males    = breeders.filter(a => a.sex === 'male');
  const females  = breeders.filter(a => a.sex === 'female');
  $('#pairForm select[name=male_id]').innerHTML   = males.map(a => `<option value="${a.id}">${a.name || a.code}</option>`).join('') || '<option value="">No male breeders yet</option>';
  $('#pairForm select[name=female_id]').innerHTML = females.map(a => `<option value="${a.id}">${a.name || a.code}</option>`).join('') || '<option value="">No female breeders yet</option>';
}

function renderAnimalsTable() {
  const roleF = $('#animalRoleFilter').value;
  const statF = $('#animalStatusFilter').value;
  let list = cacheAnimals;
  if (roleF) list = list.filter(a => a.role === roleF);
  if (statF) list = list.filter(a => a.status === statF);

  if (!list.length) { $('#animalsTableWrap').innerHTML = `<div class="empty">No animals match.</div>`; return; }

  const rows = list.map(a => {
    const img = a.image_url ? `<img src="${a.image_url}" class="thumb-sm" alt="">` : `<div class="thumb-sm" style="background:var(--sand-200);border-radius:8px"></div>`;
    const label = a.role === 'breeder' ? (a.name || a.code || '—') : (a.code || a.name || '—');
    const linkTitle = a.name ? `<a href="profile.html?id=${a.id}" target="_blank">${label}</a>` : `<a href="profile.html?id=${a.id}" target="_blank">${label}</a>`;
    return `
      <tr data-id="${a.id}">
        <td>${img}</td>
        <td><strong>${linkTitle}</strong><br><small class="muted">${a.category || ''} · ${a.species || ''}</small></td>
        <td>${a.gene || '—'}</td>
        <td>${a.sex || '—'}</td>
        <td><span class="status-pill status-${a.status}">${a.status}</span></td>
        <td>${a.price ? '$' + Number(a.price).toLocaleString() : '—'}</td>
        <td>${a.role}</td>
        <td style="text-align:right">
          <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${a.id}"><i class="fas fa-pen"></i></button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${a.id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
  }).join('');

  $('#animalsTableWrap').innerHTML = `
    <table class="table">
      <thead><tr><th></th><th>Name / Code</th><th>Gene</th><th>Sex</th><th>Status</th><th>Price</th><th>Role</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  $$('#animalsTableWrap [data-action=edit]').forEach(b => b.addEventListener('click', () => loadAnimalIntoForm(b.dataset.id)));
  $$('#animalsTableWrap [data-action=delete]').forEach(b => b.addEventListener('click', () => deleteAnimal(b.dataset.id)));
}

function loadAnimalIntoForm(id) {
  const a = cacheAnimals.find(x => x.id == id);
  if (!a) return;
  const form = $('#animalForm');
  form.id.value           = a.id;
  form.name.value         = a.name || '';
  form.code.value         = a.code || '';
  form.category.value     = a.category || 'snake';
  form.species.value      = a.species || '';
  form.role.value         = a.role || 'offspring';
  form.sex.value          = a.sex || '';
  form.gene.value         = a.gene || '';
  form.status.value       = a.status || 'available';
  form.price.value        = a.price || '';
  form.birth_date.value   = a.birth_date || '';
  form.father_id.value    = a.father_id || '';
  form.mother_id.value    = a.mother_id || '';
  form.weight.value       = a.weight || '';
  form.image_url.value    = a.image_url || '';
  form.description.value  = a.description || '';
  $('#animalsFormTitle').textContent = `Edit: ${a.name || a.code || '(animal)'}`;
  $('#animalResetBtn').style.display = 'inline-flex';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetAnimalForm() {
  const form = $('#animalForm');
  form.reset(); form.id.value = '';
  $('#animalsFormTitle').textContent = 'Add an animal';
  $('#animalResetBtn').style.display = 'none';
}

async function onAnimalSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const payload = {};
  for (const [k,v] of fd.entries()) payload[k] = v === '' ? null : v;
  // numeric coercions
  if (payload.price != null)     payload.price = Number(payload.price);
  if (payload.father_id != null) payload.father_id = payload.father_id ? Number(payload.father_id) : null;
  if (payload.mother_id != null) payload.mother_id = payload.mother_id ? Number(payload.mother_id) : null;
  const id = payload.id; delete payload.id;

  try {
    if (id) await data.updateAnimal(id, payload);
    else    await data.createAnimal(payload);
    toast(id ? 'Animal updated.' : 'Animal added.');
    resetAnimalForm();
    await refreshAnimals();
    renderAnimalsTable();
    populateAnimalParentSelects();
    populatePairSelects();
    renderDashboard();
    renderTree();
  } catch (err) { toast(err.message, 'error'); }
}

async function onAnimalImageUpload() {
  const input = $('#animalImageUpload');
  const file = input?.files?.[0];
  if (!file) return toast('Pick an image file first.', 'error');
  try {
    const dataUrl = await fileToDataUrl(file);
    $('#animalForm').image_url.value = dataUrl;
    toast('Uploaded image attached to animal.');
  } catch (err) {
    toast(err.message || 'Failed to read image file.', 'error');
  }
}

function onAnimalImageClear() {
  $('#animalForm').image_url.value = '';
  const input = $('#animalImageUpload');
  if (input) input.value = '';
  toast('Animal image cleared.');
}

async function deleteAnimal(id) {
  const a = cacheAnimals.find(x => x.id == id);
  if (!confirm(`Delete "${a?.name || a?.code || 'this animal'}"? This cannot be undone.`)) return;
  try {
    await data.deleteAnimal(id);
    toast('Animal deleted.');
    await refreshAll();
  } catch (err) { toast(err.message, 'error'); }
}

// ---------- pairs ----------
function renderPairsTable() {
  if (!cachePairs.length) { $('#pairsTableWrap').innerHTML = `<div class="empty">No breeding pairs yet.</div>`; return; }
  const rows = cachePairs.map(p => `
    <tr data-id="${p.id}">
      <td>
        <div class="row-flex">
          ${p.male_image ? `<img src="${p.male_image}" class="thumb-sm">` : ''}
          <div><strong>♂ ${p.male_name || '?'}</strong><br><small class="muted">${p.male_gene || ''}</small></div>
        </div>
      </td>
      <td>
        <div class="row-flex">
          ${p.female_image ? `<img src="${p.female_image}" class="thumb-sm">` : ''}
          <div><strong>♀ ${p.female_name || '?'}</strong><br><small class="muted">${p.female_gene || ''}</small></div>
        </div>
      </td>
      <td>${p.title || `${p.male_name || '?'} × ${p.female_name || '?'}`}</td>
      <td><strong>${p.offspring_count || 0}</strong></td>
      <td style="text-align:right">
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${p.id}"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${p.id}"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
  $('#pairsTableWrap').innerHTML = `
    <table class="table">
      <thead><tr><th>Male</th><th>Female</th><th>Title</th><th>Offspring</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  $$('#pairsTableWrap [data-action=edit]').forEach(b => b.addEventListener('click', () => loadPairIntoForm(b.dataset.id)));
  $$('#pairsTableWrap [data-action=delete]').forEach(b => b.addEventListener('click', () => deletePair(b.dataset.id)));
}

function loadPairIntoForm(id) {
  const p = cachePairs.find(x => x.id == id);
  if (!p) return;
  const form = $('#pairForm');
  form.id.value          = p.id;
  form.male_id.value     = p.male_id;
  form.female_id.value   = p.female_id;
  form.title.value       = p.title || '';
  form.description.value = p.description || '';
  $('#pairFormTitle').textContent = `Edit pair #${p.id}`;
  $('#pairResetBtn').style.display = 'inline-flex';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetPairForm() {
  const form = $('#pairForm'); form.reset(); form.id.value = '';
  $('#pairFormTitle').textContent = 'Add a breeding pair';
  $('#pairResetBtn').style.display = 'none';
}

async function onPairSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.male_id   = Number(payload.male_id);
  payload.female_id = Number(payload.female_id);
  const id = payload.id; delete payload.id;
  if (!payload.male_id || !payload.female_id) return toast('Need a male and female breeder first.', 'error');
  try {
    if (id) await data.updatePair(id, payload);
    else    await data.createPair(payload);
    toast(id ? 'Pair updated.' : 'Pair added.');
    resetPairForm();
    await refreshPairs();
    renderPairsTable();
    renderTree();
    renderDashboard();
  } catch (err) { toast(err.message, 'error'); }
}

async function deletePair(id) {
  if (!confirm('Delete this breeding pair?')) return;
  try {
    await data.deletePair(id);
    await refreshPairs();
    renderPairsTable(); renderTree(); renderDashboard();
    toast('Pair deleted.');
  } catch (err) { toast(err.message, 'error'); }
}

// ---------- requests ----------
function requestsTableHtml(list) {
  const rows = list.map(r => {
    const dt = r.created_at ? new Date(r.created_at.replace(' ', 'T')).toLocaleString() : '—';
    const type = r.inquiry_type === 'buy' ? '<span class="status-pill status-available">Buy</span>' : '<span class="status-pill status-reserved">Question</span>';
    return `
      <tr data-id="${r.id}">
        <td>${dt}</td>
        <td>${type}</td>
        <td><strong>${r.customer_name}</strong><br><small class="muted">${r.customer_email}${r.customer_phone ? ' · ' + r.customer_phone : ''}</small></td>
        <td>${r.animal_code || (r.animal_id ? '#' + r.animal_id : '—')}</td>
        <td>${r.message ? `<small>${escapeHtml(r.message).slice(0,120)}${r.message.length>120?'…':''}</small>` : '—'}</td>
        <td>
          <select data-action="status" data-id="${r.id}" style="padding:.35rem;border-radius:6px;border:1px solid var(--sand-300)">
            ${['new','contacted','completed','declined'].map(s => `<option value="${s}" ${s===r.status?'selected':''}>${s}</option>`).join('')}
          </select>
        </td>
        <td style="text-align:right">
          <button class="btn btn-ghost btn-sm" data-action="mail" data-id="${r.id}"><i class="fas fa-envelope"></i></button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${r.id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
  }).join('');
  return `
    <table class="table">
      <thead><tr><th>When</th><th>Type</th><th>Customer</th><th>Animal</th><th>Message</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderRequestsTable() {
  const wrap = $('#requestsTableWrap');
  if (!cacheReqs.length) { wrap.innerHTML = `<div class="empty">No purchase requests or questions yet.</div>`; return; }
  wrap.innerHTML = requestsTableHtml(cacheReqs);
  bindRequestRowActions();
}

function bindRequestRowActions() {
  $$('[data-action=status]').forEach(sel => sel.addEventListener('change', async () => {
    try {
      await data.updateRequest(sel.dataset.id, { status: sel.value });
      toast('Status updated.');
      await refreshRequests();
      renderDashboard();
    } catch (e) { toast(e.message, 'error'); }
  }));
  $$('[data-action=delete][data-id]').forEach(btn => btn.addEventListener('click', async () => {
    if (btn.closest('tbody')?.parentElement?.parentElement?.id !== 'requestsTableWrap' && !btn.closest('#dashRequests')) return;
    if (!confirm('Delete this request?')) return;
    try { await data.deleteRequest(btn.dataset.id); await refreshRequests(); renderRequestsTable(); renderDashboard(); toast('Deleted.'); }
    catch (e) { toast(e.message, 'error'); }
  }));
  $$('[data-action=mail]').forEach(btn => btn.addEventListener('click', () => {
    const r = cacheReqs.find(x => x.id == btn.dataset.id); if (!r) return;
    const subject = encodeURIComponent(`Re: your inquiry — ${r.animal_code || 'Borealis Reptiles'}`);
    const body = encodeURIComponent(`Hi ${r.customer_name},\n\nThanks for your message about ${r.animal_code || 'our animals'}.\n\n— Borealis Reptiles`);
    window.location.href = `mailto:${r.customer_email}?subject=${subject}&body=${body}`;
  }));
}

// ---------- tree ----------
function renderTree() {
  if (!cachePairs.length) { $('#treeWrap').innerHTML = `<div class="empty">No pairs yet.</div>`; return; }
  $('#treeWrap').innerHTML = cachePairs.map(p => {
    const offs = cacheAnimals.filter(a => a.father_id == p.male_id && a.mother_id == p.female_id);
    return `
      <div class="tree-pair">
        <div class="heads">
          ${p.male_image ? `<img src="${p.male_image}">` : ''}
          <span class="hname">♂ ${p.male_name || '?'}</span>
          <span class="muted">×</span>
          ${p.female_image ? `<img src="${p.female_image}">` : ''}
          <span class="hname">♀ ${p.female_name || '?'}</span>
        </div>
        <div class="kids">
          ${offs.length ? offs.map(o => `<a href="profile.html?id=${o.id}" target="_blank">${o.code || o.name || '#'+o.id} · ${o.gene || ''}</a>`).join('')
                       : '<span class="muted" style="font-size:.85rem">No offspring yet</span>'}
        </div>
      </div>`;
  }).join('');
}

// ---------- reset demo ----------
async function onResetDemo() {
  if ((await data.mode()) !== 'local') return toast('This only applies in local demo mode.', 'error');
  if (!confirm('Reset all local demo data? This clears your browser storage and re-seeds the default collection.')) return;
  await data.resetDemo();
  await refreshAll();
  toast('Demo data reset.');
}

// ==========================================================
// Merchandise
// ==========================================================
function typeLabel(t) { return t ? t[0].toUpperCase() + t.slice(1) : '—'; }

function renderMerchTable() {
  const wrap = $('#merchTableWrap');
  if (!cacheMerch.length) { wrap.innerHTML = `<div class="empty">No merchandise yet.</div>`; return; }
  const rows = cacheMerch.map(m => {
    const img = m.image_url
      ? `<img src="${m.image_url}" class="thumb-sm" alt="">`
      : `<div class="thumb-sm" style="background:var(--sand-200);border-radius:8px"></div>`;
    const price = m.price != null ? `$${Number(m.price).toFixed(2)}` : '—';
    return `
      <tr data-id="${m.id}">
        <td>${img}</td>
        <td><strong>${escapeHtml(m.name)}</strong><br><small class="muted">${m.code || ''}</small></td>
        <td>${typeLabel(m.type)}</td>
        <td>${escapeHtml(m.material || '—')}</td>
        <td>${m.shed_source ? '<strong>' + escapeHtml(m.shed_source) + '</strong>' : '—'}</td>
        <td>${price}</td>
        <td><span class="status-pill status-${m.status}">${m.status || 'available'}</span></td>
        <td>${Number(m.featured) === 1 ? '<i class="fas fa-star" style="color:var(--amber-500)"></i>' : ''}</td>
        <td style="text-align:right">
          <button class="btn btn-ghost btn-sm" data-action="edit-merch" data-id="${m.id}"><i class="fas fa-pen"></i></button>
          <button class="btn btn-danger btn-sm" data-action="del-merch" data-id="${m.id}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
  }).join('');
  wrap.innerHTML = `
    <table class="table">
      <thead><tr><th></th><th>Name</th><th>Type</th><th>Material</th><th>Shed from</th><th>Price</th><th>Status</th><th>Featured</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  $$('[data-action=edit-merch]').forEach(b => b.addEventListener('click', () => loadMerchIntoForm(b.dataset.id)));
  $$('[data-action=del-merch]').forEach(b => b.addEventListener('click', () => deleteMerch(b.dataset.id)));
}

function loadMerchIntoForm(id) {
  const m = cacheMerch.find(x => x.id == id);
  if (!m) return;
  const form = $('#merchForm');
  form.id.value          = m.id;
  form.name.value        = m.name || '';
  form.code.value        = m.code || '';
  form.type.value        = m.type || 'necklace';
  form.material.value    = m.material || '';
  form.shed_source.value = m.shed_source || '';
  form.price.value       = m.price ?? '';
  form.status.value      = m.status || 'available';
  form.featured.value    = String(m.featured ?? 0);
  form.sort_order.value  = m.sort_order ?? 0;
  form.image_url.value   = m.image_url || '';
  form.description.value = m.description || '';
  $('#merchFormTitle').textContent = `Edit: ${m.name}`;
  $('#merchResetBtn').style.display = 'inline-flex';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetMerchForm() {
  const f = $('#merchForm'); f.reset(); f.id.value = '';
  $('#merchFormTitle').textContent = 'Add a merchandise piece';
  $('#merchResetBtn').style.display = 'none';
}

async function onMerchSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const payload = Object.fromEntries(new FormData(form).entries());
  for (const k of Object.keys(payload)) if (payload[k] === '') payload[k] = null;
  if (payload.price != null) payload.price = Number(payload.price);
  if (payload.featured != null) payload.featured = Number(payload.featured);
  if (payload.sort_order != null) payload.sort_order = Number(payload.sort_order);
  const id = payload.id; delete payload.id;

  try {
    if (id) await data.updateMerchandise(id, payload);
    else    await data.createMerchandise(payload);
    toast(id ? 'Piece updated.' : 'Piece added.');
    resetMerchForm();
    await refreshMerch();
    renderMerchTable();
    renderDashboard();
  } catch (err) { toast(err.message, 'error'); }
}

async function onMerchImageUpload() {
  const input = $('#merchImageUpload');
  const file = input?.files?.[0];
  if (!file) return toast('Pick an image file first.', 'error');
  try {
    const dataUrl = await fileToDataUrl(file);
    $('#merchForm').image_url.value = dataUrl;
    toast('Uploaded image attached to merchandise.');
  } catch (err) {
    toast(err.message || 'Failed to read image file.', 'error');
  }
}

function onMerchImageClear() {
  $('#merchForm').image_url.value = '';
  const input = $('#merchImageUpload');
  if (input) input.value = '';
  toast('Merchandise image cleared.');
}

async function deleteMerch(id) {
  const m = cacheMerch.find(x => x.id == id);
  if (!confirm(`Delete "${m?.name || 'this piece'}"?`)) return;
  try {
    await data.deleteMerchandise(id);
    await refreshMerch(); renderMerchTable(); renderDashboard();
    toast('Deleted.');
  } catch (err) { toast(err.message, 'error'); }
}

// ==========================================================
// Care sheets
// ==========================================================
function renderCareTable() {
  const wrap = $('#careTableWrap');
  if (!cacheCare.length) { wrap.innerHTML = `<div class="empty">No care sheets yet.</div>`; return; }
  const rows = cacheCare.map(c => `
    <tr data-id="${c.id}">
      <td>${c.sort_order ?? 0}</td>
      <td><strong>${escapeHtml(c.title)}</strong><br><small class="muted">${c.slug || ''}</small></td>
      <td>${escapeHtml(c.summary || '—')}</td>
      <td style="text-align:right">
        <button class="btn btn-ghost btn-sm" data-action="edit-care" data-id="${c.id}"><i class="fas fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" data-action="del-care" data-id="${c.id}"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
  wrap.innerHTML = `
    <table class="table">
      <thead><tr><th>#</th><th>Title</th><th>Summary</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  $$('[data-action=edit-care]').forEach(b => b.addEventListener('click', () => loadCareIntoForm(b.dataset.id)));
  $$('[data-action=del-care]').forEach(b => b.addEventListener('click', () => deleteCare(b.dataset.id)));
}

function loadCareIntoForm(id) {
  const c = cacheCare.find(x => x.id == id);
  if (!c) return;
  const form = $('#careForm');
  form.id.value         = c.id;
  form.title.value      = c.title || '';
  form.summary.value    = c.summary || '';
  form.content.value    = c.content || '';
  form.sort_order.value = c.sort_order ?? 0;
  $('#careFormTitle').textContent = `Edit: ${c.title}`;
  $('#careResetBtn').style.display = 'inline-flex';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetCareForm() {
  const f = $('#careForm'); f.reset(); f.id.value = '';
  $('#careFormTitle').textContent = 'Add a care sheet';
  $('#careResetBtn').style.display = 'none';
}

async function onCareSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const payload = Object.fromEntries(new FormData(form).entries());
  for (const k of Object.keys(payload)) if (payload[k] === '') payload[k] = null;
  if (payload.sort_order != null) payload.sort_order = Number(payload.sort_order);
  const id = payload.id; delete payload.id;
  try {
    if (id) await data.updateCareSheet(id, payload);
    else    await data.createCareSheet(payload);
    toast(id ? 'Care sheet updated.' : 'Care sheet added.');
    resetCareForm();
    await refreshCare();
    renderCareTable();
    renderDashboard();
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteCare(id) {
  const c = cacheCare.find(x => x.id == id);
  if (!confirm(`Delete "${c?.title || 'this care sheet'}"?`)) return;
  try {
    await data.deleteCareSheet(id);
    await refreshCare(); renderCareTable(); renderDashboard();
    toast('Deleted.');
  } catch (err) { toast(err.message, 'error'); }
}

// ---------- utils ----------
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function fileToDataUrl(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image.');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Image is too large. Keep uploads under 2MB.');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}
