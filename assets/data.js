// ============================================================
// Borealis Reptiles — Data layer
// ------------------------------------------------------------
// Tries the real Cloudflare Pages Functions API first. If the
// API isn't reachable (e.g. you're double-clicking the HTML file
// on your PC), it transparently falls back to browser localStorage
// with a seeded demo dataset so you can test everything offline.
// Same calls, same results — just switch environments.
// ============================================================

const API_BASE = '/api';
const LS_KEY   = 'borealis_local_db_v2';   // bump: new tables (merchandise, care_sheets)
const LS_AUTH  = 'borealis_local_admin_v1';
const LOCAL_ADMIN_PASSWORD_KEY = 'borealis_local_admin_pw'; // changeable in-browser

let _backendMode = null; // 'api' | 'local' (detected lazily)

// --------------- Detection ---------------
async function probeApi() {
  try {
    const r = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    if (!r.ok) return false;
    const j = await r.json();
    return j.ok === true && j.db === true;
  } catch { return false; }
}

async function mode() {
  if (_backendMode) return _backendMode;
  _backendMode = (await probeApi()) ? 'api' : 'local';
  return _backendMode;
}

export async function getBackendMode() { return await mode(); }

// --------------- API helpers ---------------
async function apiCall(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: 'include',
    ...opts,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// --------------- Local (browser) backend ---------------
function loadLocal() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  return seedLocal();
}
function saveLocal(db) { localStorage.setItem(LS_KEY, JSON.stringify(db)); }

function seedLocal() {
  const db = {
    animals: [],
    pairs: [],
    requests: [],
    merchandise: [],
    careSheets: [],
    nextAnimalId: 1,
    nextPairId: 1,
    nextRequestId: 1,
    nextMerchId: 1,
    nextCareId: 1,
  };
  const now = new Date().toISOString();
  const mk = (a) => {
    const row = {
      id: db.nextAnimalId++,
      code: null, name: null, category: 'snake', species: null, sex: null,
      gene: null, birth_date: null, weight: null, description: null,
      image_url: null, price: null, status: 'available', role: 'offspring',
      mother_id: null, father_id: null, created_at: now, ...a,
    };
    db.animals.push(row); return row;
  };

  const nagini  = mk({ name:'Nagini',  category:'snake', species:'Ball Python', sex:'female', gene:'Pastel',    role:'breeder', status:'breeder', image_url:'imgs/snakes/emerald.jpg', description:'Our flagship Pastel female. Consistently produces stunning clutches.' });
  const opal    = mk({ name:'Opal',    category:'snake', species:'Ball Python', sex:'male',   gene:'Mojave',    role:'breeder', status:'breeder', image_url:'imgs/snakes/opal.jpg',    description:'Calm-tempered Mojave male with exceptional pattern.' });
  const axinite = mk({ name:'Axinite', category:'snake', species:'Ball Python', sex:'male',   gene:'Spider',    role:'breeder', status:'breeder', image_url:'imgs/snakes/back1.jpg',   description:'Spider male with tight pattern and bright coloration.' });
  const jasper  = mk({ name:'Jasper',  category:'snake', species:'Ball Python', sex:'male',   gene:'Pinstripe', role:'breeder', status:'breeder', image_url:'imgs/snakes/jasper.jpg',  description:'Clean pinstripe male, great temperament.' });
  const peridot = mk({ name:'Peridot', category:'snake', species:'Ball Python', sex:'female', gene:'Mojave',    role:'breeder', status:'breeder', image_url:'imgs/snakes/quartize.jpg',description:'Proven Mojave female.' });

  db.pairs.push(
    { id: db.nextPairId++, male_id: opal.id,    female_id: nagini.id,  title: null, description:'Pastel × Mojave',    created_at: now },
    { id: db.nextPairId++, male_id: axinite.id, female_id: nagini.id,  title: null, description:'Pastel × Spider',    created_at: now },
    { id: db.nextPairId++, male_id: jasper.id,  female_id: peridot.id, title: null, description:'Pinstripe × Mojave', created_at: now },
  );

  // Offspring
  const babies = [
    ['NAOP01','Pastel Mojave',250,'imgs/snakes/amber.jpg',   opal.id, nagini.id,'available', 'Beautiful pastel mojave hatchling.'],
    ['NAOP02','Pastel',       150,'imgs/snakes/emerald.jpg', opal.id, nagini.id,'available', 'Bright pastel, feeds reliably on f/t hoppers.'],
    ['NAOP03','Mojave',       200,'imgs/snakes/jasper.jpg',  opal.id, nagini.id,'sold',      'Classic Mojave expression.'],
    ['NAOP04','Normal',       100,'imgs/snakes/opal.jpg',    opal.id, nagini.id,'available', 'Great starter snake with excellent disposition.'],
    ['NAAX01','Bumblebee',    300,'imgs/snakes/quartize.jpg',axinite.id, nagini.id,'available','Bumblebee (Pastel Spider).'],
    ['NAAX02','Pastel',       150,'imgs/snakes/zoiste .jpg', axinite.id, nagini.id,'available','Clean pastel female.'],
    ['NAAX03','Spider',       180,'imgs/snakes/back1.jpg',   axinite.id, nagini.id,'sold',     'Spider male.'],
    ['NAAX04','Normal',       100,'imgs/snakes/amber.jpg',   axinite.id, nagini.id,'available','Normal — perfect starter snake.'],
    ['JAPE01','Pinstripe Mojave',320,'imgs/snakes/emerald.jpg', jasper.id, peridot.id,'available','Striking pinstripe mojave combo.'],
    ['JAPE02','Pinstripe',    220,'imgs/snakes/jasper.jpg',  jasper.id, peridot.id,'available','Clean pinstripe.'],
    ['JAPE03','Mojave',       200,'imgs/snakes/quartize.jpg',jasper.id, peridot.id,'available','Bright mojave.'],
    ['JAPE04','Normal',       100,'imgs/snakes/opal.jpg',    jasper.id, peridot.id,'sold',     'Normal.'],
  ];
  for (const [code,gene,price,img,father,mother,status,desc] of babies) {
    mk({ code, gene, price, image_url:img, father_id:father, mother_id:mother, status, description:desc, category:'snake', species:'Ball Python' });
  }

  // --- Merchandise (by Sara) ---
  const merchSeeds = [
    ['NECK-001','Emerald Shed Necklace','necklace','Stainless steel','Nagini','Delicate pendant set with a preserved snake shed from Nagini. Each piece is one of a kind.','imgs/merchandise/merch1.jpg',89.99,1,1],
    ['HEAD-002','Mojave Shed Headband','headband','Leather + brass','Opal','Handmade leather headband accented with a preserved shed section.','imgs/merchandise/merch2.jpg',129.99,1,2],
    ['BRAC-003','Spider Shed Bracelet','bracelet','Sterling silver','Axinite','Braided silver with a tiny vial of shed. Adjustable.','imgs/merchandise/merch3.jpg',149.99,1,3],
    ['EARR-004','Amber Shed Drop Earrings','earrings','Gold-plated','Nagini','Drop earrings with a fragment of amber pastel shed.','imgs/snakes/amber.jpg',119.99,0,4],
    ['NECK-005','Emerald Pendant','necklace','Sterling silver','Peridot','Mojave-pattern shed in a crystal pendant.','imgs/snakes/emerald.jpg',199.99,0,5],
    ['BRAC-006','Onyx Shed Bracelet','bracelet','Stainless steel + onyx','Axinite','Stainless steel bracelet with onyx and a fragment of preserved shed.','imgs/snakes/quartize.jpg',249.99,0,6],
  ];
  for (const [code,name,type,material,shed_source,description,image_url,price,featured,sort_order] of merchSeeds) {
    db.merchandise.push({
      id: db.nextMerchId++, code, name, type, material, shed_source, description, image_url,
      price, status: 'available', featured, sort_order, created_at: now,
    });
  }

  // --- Care sheets ---
  const careSeeds = [
    ['ball-python','Ball Python','The classic beginner snake — docile, hardy and easy to keep.',
      `Temperature: 78–82°F ambient, 88–92°F basking
Humidity: 55–65%
Feeding: Weekly for juveniles, every 10–14 days for adults. Frozen-thawed rodents only.
Enclosure: 40-gallon (4'×2'×1.5') minimum for an adult
Substrate: Cypress mulch, coco husk or a mix
Hides: At least two (one on the warm side, one on the cool side)
Water: Clean, chlorine-free water at all times — big enough to soak in
Handling: Short daily sessions once settled; skip the week after a feed`, 1],
    ['corn-snake','Corn Snake','Active, colourful and very forgiving — a great first snake.',
      `Temperature: 75–82°F ambient, 85–88°F basking
Humidity: 40–50%
Feeding: Weekly for juveniles, every 10–14 days for adults
Enclosure: 20-gallon long minimum, 40+ for large adults
Substrate: Aspen shavings or cypress mulch
Hides: At least two, plus climbing branches
Water: Medium bowl — they don't typically soak
Handling: Tolerates daily handling once settled`, 2],
    ['leopard-gecko','Leopard Gecko','A calm, ground-dwelling gecko that rarely bites.',
      `Warm end: ~90°F (UTH + thermostat)
Cool end: 70–75°F
Humidity: 30–40% ambient with a humid hide at 60–70%
Feeding: Crickets, mealworms or dubia roaches dusted with calcium + D3
Enclosure: 20-gallon long minimum for a single adult
Substrate: Slate tile, reptile carpet, or paper towel
Hides: Three — warm, cool, and humid
Water: Shallow dish, always clean`, 3],
  ];
  for (const [slug,title,summary,content,sort_order] of careSeeds) {
    db.careSheets.push({
      id: db.nextCareId++, slug, title, summary, content, sort_order,
      created_at: now, updated_at: now,
    });
  }

  saveLocal(db);
  return db;
}

const localApi = {
  // ---- Animals ----
  listAnimals({ role, category, status, parent_id } = {}) {
    const db = loadLocal();
    let list = db.animals;
    if (role)     list = list.filter(a => a.role === role);
    if (category) list = list.filter(a => a.category === category);
    if (status)   list = list.filter(a => a.status === status);
    if (parent_id) list = list.filter(a => a.mother_id == parent_id || a.father_id == parent_id);
    return [...list].sort((a,b) => (a.role === 'breeder' ? -1 : 1) - (b.role === 'breeder' ? -1 : 1) || a.id - b.id);
  },
  getAnimal(id) {
    const db = loadLocal();
    const animal = db.animals.find(a => a.id === Number(id));
    if (!animal) return null;
    const parents = {};
    if (animal.mother_id) parents.mother = db.animals.find(a => a.id === animal.mother_id);
    if (animal.father_id) parents.father = db.animals.find(a => a.id === animal.father_id);
    const offspring = db.animals.filter(a => a.mother_id === animal.id || a.father_id === animal.id);
    return { animal, parents, offspring };
  },
  createAnimal(data) {
    const db = loadLocal();
    const row = {
      id: db.nextAnimalId++, code: null, name: null, category:'snake',
      species:null, sex:null, gene:null, birth_date:null, weight:null,
      description:null, image_url:null, price:null, status:'available',
      role:'offspring', mother_id:null, father_id:null,
      created_at: new Date().toISOString(), ...data,
    };
    for (const k of Object.keys(row)) if (row[k] === '') row[k] = null;
    db.animals.push(row); saveLocal(db); return row;
  },
  updateAnimal(id, data) {
    const db = loadLocal();
    const i = db.animals.findIndex(a => a.id === Number(id));
    if (i < 0) throw new Error('Not found');
    for (const k of Object.keys(data)) {
      if (data[k] !== undefined) db.animals[i][k] = data[k] === '' ? null : data[k];
    }
    saveLocal(db); return db.animals[i];
  },
  deleteAnimal(id) {
    const db = loadLocal();
    db.animals = db.animals.filter(a => a.id !== Number(id));
    for (const a of db.animals) {
      if (a.mother_id === Number(id)) a.mother_id = null;
      if (a.father_id === Number(id)) a.father_id = null;
    }
    db.pairs = db.pairs.filter(p => p.male_id !== Number(id) && p.female_id !== Number(id));
    saveLocal(db);
  },

  // ---- Pairs ----
  listPairs() {
    const db = loadLocal();
    return db.pairs.map(p => {
      const m = db.animals.find(a => a.id === p.male_id) || {};
      const f = db.animals.find(a => a.id === p.female_id) || {};
      const offspring_count = db.animals.filter(a => a.father_id === p.male_id && a.mother_id === p.female_id).length;
      return {
        ...p,
        male_name: m.name, male_gene: m.gene, male_image: m.image_url,
        female_name: f.name, female_gene: f.gene, female_image: f.image_url,
        offspring_count,
      };
    });
  },
  getPair(id) {
    const db = loadLocal();
    const p = db.pairs.find(x => x.id === Number(id));
    if (!p) return null;
    const m = db.animals.find(a => a.id === p.male_id) || {};
    const f = db.animals.find(a => a.id === p.female_id) || {};
    const offspring = db.animals.filter(a => a.father_id === p.male_id && a.mother_id === p.female_id);
    return {
      pair: {
        ...p, male_name: m.name, male_gene: m.gene, male_image: m.image_url, male_id: m.id,
        female_name: f.name, female_gene: f.gene, female_image: f.image_url, female_id: f.id,
      },
      offspring,
    };
  },
  createPair(data) {
    const db = loadLocal();
    const p = {
      id: db.nextPairId++, male_id: Number(data.male_id), female_id: Number(data.female_id),
      title: data.title || null, description: data.description || null, created_at: new Date().toISOString(),
    };
    db.pairs.push(p); saveLocal(db); return p;
  },
  updatePair(id, data) {
    const db = loadLocal();
    const i = db.pairs.findIndex(p => p.id === Number(id));
    if (i < 0) throw new Error('Not found');
    Object.assign(db.pairs[i], data);
    saveLocal(db); return db.pairs[i];
  },
  deletePair(id) {
    const db = loadLocal();
    db.pairs = db.pairs.filter(p => p.id !== Number(id));
    saveLocal(db);
  },

  // ---- Requests ----
  listRequests() {
    const db = loadLocal();
    return [...db.requests].sort((a,b) => (b.created_at || '').localeCompare(a.created_at || ''));
  },
  createRequest(data) {
    const db = loadLocal();
    let animalId = data.animal_id || null;
    if (!animalId && data.animal_code) {
      const found = db.animals.find(a => a.code === data.animal_code);
      if (found) animalId = found.id;
    }
    const r = {
      id: db.nextRequestId++,
      animal_id: animalId, animal_code: data.animal_code || null,
      inquiry_type: data.inquiry_type || 'buy',
      customer_name: data.customer_name, customer_email: data.customer_email,
      customer_phone: data.customer_phone || null, shipping_address: data.shipping_address || null,
      message: data.message || null, status: 'new',
      created_at: new Date().toISOString(),
    };
    db.requests.push(r); saveLocal(db); return r;
  },
  updateRequest(id, data) {
    const db = loadLocal();
    const i = db.requests.findIndex(r => r.id === Number(id));
    if (i < 0) throw new Error('Not found');
    Object.assign(db.requests[i], data);
    saveLocal(db); return db.requests[i];
  },
  deleteRequest(id) {
    const db = loadLocal();
    db.requests = db.requests.filter(r => r.id !== Number(id));
    saveLocal(db);
  },

  // ---- Merchandise ----
  listMerchandise({ featured, status } = {}) {
    const db = loadLocal();
    let list = db.merchandise || [];
    if (featured !== undefined) list = list.filter(m => Number(m.featured) === Number(featured));
    if (status) list = list.filter(m => m.status === status);
    return [...list].sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id));
  },
  getMerchandise(id) {
    const db = loadLocal();
    return (db.merchandise || []).find(m => m.id === Number(id)) || null;
  },
  createMerchandise(data) {
    const db = loadLocal();
    if (!db.merchandise) { db.merchandise = []; db.nextMerchId = 1; }
    const row = {
      id: db.nextMerchId++, code: null, name: null, type: null, material: null,
      shed_source: null, description: null, image_url: null, price: null,
      status: 'available', featured: 0, sort_order: 0,
      created_at: new Date().toISOString(), ...data,
    };
    for (const k of Object.keys(row)) if (row[k] === '') row[k] = null;
    db.merchandise.push(row); saveLocal(db); return row;
  },
  updateMerchandise(id, data) {
    const db = loadLocal();
    const i = (db.merchandise || []).findIndex(m => m.id === Number(id));
    if (i < 0) throw new Error('Not found');
    for (const k of Object.keys(data)) if (data[k] !== undefined) db.merchandise[i][k] = data[k] === '' ? null : data[k];
    saveLocal(db); return db.merchandise[i];
  },
  deleteMerchandise(id) {
    const db = loadLocal();
    db.merchandise = (db.merchandise || []).filter(m => m.id !== Number(id));
    saveLocal(db);
  },

  // ---- Care sheets ----
  listCareSheets() {
    const db = loadLocal();
    return [...(db.careSheets || [])].sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id));
  },
  getCareSheet(id) {
    const db = loadLocal();
    return (db.careSheets || []).find(c => c.id === Number(id)) || null;
  },
  createCareSheet(data) {
    const db = loadLocal();
    if (!db.careSheets) { db.careSheets = []; db.nextCareId = 1; }
    const slug = (data.slug || data.title || '').toString().toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const now = new Date().toISOString();
    const row = {
      id: db.nextCareId++, slug: slug || null, title: data.title || 'Untitled',
      summary: data.summary || null, content: data.content || null,
      sort_order: data.sort_order ?? 0, created_at: now, updated_at: now,
    };
    db.careSheets.push(row); saveLocal(db); return row;
  },
  updateCareSheet(id, data) {
    const db = loadLocal();
    const i = (db.careSheets || []).findIndex(c => c.id === Number(id));
    if (i < 0) throw new Error('Not found');
    for (const k of Object.keys(data)) if (data[k] !== undefined) db.careSheets[i][k] = data[k] === '' ? null : data[k];
    db.careSheets[i].updated_at = new Date().toISOString();
    saveLocal(db); return db.careSheets[i];
  },
  deleteCareSheet(id) {
    const db = loadLocal();
    db.careSheets = (db.careSheets || []).filter(c => c.id !== Number(id));
    saveLocal(db);
  },

  // ---- Auth (local demo only) ----
  getLocalPassword() { return localStorage.getItem(LOCAL_ADMIN_PASSWORD_KEY) || 'duncan'; },
  setLocalPassword(p) { localStorage.setItem(LOCAL_ADMIN_PASSWORD_KEY, p); },
  login(password) {
    if (password === this.getLocalPassword()) { localStorage.setItem(LS_AUTH,'1'); return true; }
    return false;
  },
  logout() { localStorage.removeItem(LS_AUTH); },
  isAuthed() { return localStorage.getItem(LS_AUTH) === '1'; },

  resetDemo() { localStorage.removeItem(LS_KEY); return seedLocal(); },
};

// --------------- Unified API ---------------
function qs(params) {
  const s = new URLSearchParams();
  for (const [k,v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') s.set(k, v);
  }
  const str = s.toString();
  return str ? `?${str}` : '';
}

export const data = {
  async mode() { return await mode(); },

  // Animals
  async listAnimals(filters = {}) {
    if ((await mode()) === 'local') return localApi.listAnimals(filters);
    const j = await apiCall(`/animals${qs(filters)}`);
    return j.animals;
  },
  async getAnimal(id) {
    if ((await mode()) === 'local') return localApi.getAnimal(id);
    return await apiCall(`/animals/${id}`);
  },
  async createAnimal(payload) {
    if ((await mode()) === 'local') return localApi.createAnimal(payload);
    return (await apiCall(`/animals`, { method: 'POST', body: JSON.stringify(payload) })).animal;
  },
  async updateAnimal(id, payload) {
    if ((await mode()) === 'local') return localApi.updateAnimal(id, payload);
    return (await apiCall(`/animals/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })).animal;
  },
  async deleteAnimal(id) {
    if ((await mode()) === 'local') return localApi.deleteAnimal(id);
    return await apiCall(`/animals/${id}`, { method: 'DELETE' });
  },

  // Pairs
  async listPairs() {
    if ((await mode()) === 'local') return localApi.listPairs();
    return (await apiCall(`/pairs`)).pairs;
  },
  async getPair(id) {
    if ((await mode()) === 'local') return localApi.getPair(id);
    return await apiCall(`/pairs/${id}`);
  },
  async createPair(payload) {
    if ((await mode()) === 'local') return localApi.createPair(payload);
    return await apiCall(`/pairs`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async updatePair(id, payload) {
    if ((await mode()) === 'local') return localApi.updatePair(id, payload);
    return await apiCall(`/pairs/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  async deletePair(id) {
    if ((await mode()) === 'local') return localApi.deletePair(id);
    return await apiCall(`/pairs/${id}`, { method: 'DELETE' });
  },

  // Requests
  async listRequests() {
    if ((await mode()) === 'local') return localApi.listRequests();
    return (await apiCall(`/requests`)).requests;
  },
  async createRequest(payload) {
    if ((await mode()) === 'local') return localApi.createRequest(payload);
    return await apiCall(`/requests`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async updateRequest(id, payload) {
    if ((await mode()) === 'local') return localApi.updateRequest(id, payload);
    return await apiCall(`/requests/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  async deleteRequest(id) {
    if ((await mode()) === 'local') return localApi.deleteRequest(id);
    return await apiCall(`/requests/${id}`, { method: 'DELETE' });
  },

  // Merchandise
  async listMerchandise(filters = {}) {
    if ((await mode()) === 'local') return localApi.listMerchandise(filters);
    return (await apiCall(`/merchandise${qs(filters)}`)).merchandise;
  },
  async getMerchandise(id) {
    if ((await mode()) === 'local') return localApi.getMerchandise(id);
    return (await apiCall(`/merchandise/${id}`)).item;
  },
  async createMerchandise(payload) {
    if ((await mode()) === 'local') return localApi.createMerchandise(payload);
    return (await apiCall(`/merchandise`, { method: 'POST', body: JSON.stringify(payload) })).item;
  },
  async updateMerchandise(id, payload) {
    if ((await mode()) === 'local') return localApi.updateMerchandise(id, payload);
    return (await apiCall(`/merchandise/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })).item;
  },
  async deleteMerchandise(id) {
    if ((await mode()) === 'local') return localApi.deleteMerchandise(id);
    return await apiCall(`/merchandise/${id}`, { method: 'DELETE' });
  },

  // Care sheets
  async listCareSheets() {
    if ((await mode()) === 'local') return localApi.listCareSheets();
    return (await apiCall(`/care-sheets`)).sheets;
  },
  async getCareSheet(id) {
    if ((await mode()) === 'local') return localApi.getCareSheet(id);
    return (await apiCall(`/care-sheets/${id}`)).sheet;
  },
  async createCareSheet(payload) {
    if ((await mode()) === 'local') return localApi.createCareSheet(payload);
    return (await apiCall(`/care-sheets`, { method: 'POST', body: JSON.stringify(payload) })).sheet;
  },
  async updateCareSheet(id, payload) {
    if ((await mode()) === 'local') return localApi.updateCareSheet(id, payload);
    return (await apiCall(`/care-sheets/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })).sheet;
  },
  async deleteCareSheet(id) {
    if ((await mode()) === 'local') return localApi.deleteCareSheet(id);
    return await apiCall(`/care-sheets/${id}`, { method: 'DELETE' });
  },

  // Auth
  async login(password) {
    if ((await mode()) === 'local') return localApi.login(password);
    try { await apiCall(`/auth/login`, { method: 'POST', body: JSON.stringify({ password }) }); return true; }
    catch { return false; }
  },
  async logout() {
    if ((await mode()) === 'local') return localApi.logout();
    try { await apiCall(`/auth/logout`, { method: 'POST' }); } catch {}
  },
  async isAuthed() {
    if ((await mode()) === 'local') return localApi.isAuthed();
    try { const j = await apiCall(`/auth/me`); return !!j.authed; } catch { return false; }
  },

  // Local-mode helpers (no-op on API)
  async resetDemo() {
    if ((await mode()) === 'local') return localApi.resetDemo();
  },
  async setLocalPassword(p) {
    if ((await mode()) === 'local') return localApi.setLocalPassword(p);
  },
};
