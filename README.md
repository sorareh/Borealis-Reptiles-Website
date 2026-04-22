# Borealis Reptiles — website

A small reptile breeder site with:

- A public storefront (breeding pairs, offspring, profiles, care sheets, contact).
- Individual **profile pages** for every animal, with parents & offspring linked.
- A **"Request to buy"** button on each profile that stores the request in the database **and** opens a pre-filled email to you.
- A full **admin panel** (`/admin`) where you can add / edit / delete animals of any reptile type, create breeding pairs, and manage purchase requests.

The same code runs in two modes:

- **Local demo mode** — open `index.html` in your browser (no server needed). Data is kept in the browser's localStorage so you can try everything without setup.
- **Production mode** — deploy to Cloudflare Pages with a D1 database. The frontend automatically detects the backend and switches over.

---

## 1. Try it right now on your PC

You don't need to install anything. Just serve the folder as static files:

```bash
# Option A — Python (comes with macOS / most Linux)
cd Borealis-Reptiles-Website
python3 -m http.server 8000
# then open http://localhost:8000

# Option B — Node
cd Borealis-Reptiles-Website
npx serve .
```

> Tip: you *can* also just double-click `index.html`, but a few browsers block `fetch` of the favicon/icons from `file://` URLs. Serving it is safer.

Default admin password: **`duncan`** · to change it in local mode, run this in the browser console after signing in:

```js
localStorage.setItem('borealis_local_admin_pw', 'my-new-password')
```

Resetting local demo data: open `/admin`, go to **Dashboard → Reset local demo data**, or from the browser console run `localStorage.clear()`.

---

## 2. Deploy to Cloudflare Pages + D1

### One-time setup

1. Install wrangler and log in:
   ```bash
   npm install
   npx wrangler login
   ```
2. Create the D1 database:
   ```bash
   npx wrangler d1 create borealis-db
   ```
   Copy the `database_id` it prints into `wrangler.toml` (replacing `REPLACE_WITH_YOUR_D1_ID`).
3. Create the schema and seed some demo data (both local-emulation + remote):
   ```bash
   npm run db:init:local && npm run db:seed:local   # for local dev
   npm run db:init       && npm run db:seed         # for production
   ```
4. Deploy:
   ```bash
   npm run deploy
   ```
5. In the Cloudflare dashboard → your Pages project → **Settings → Environment variables**:
   - Add `ADMIN_PASSWORD` (the password used on `/admin`)
   - Add `ADMIN_SECRET` (any long random string — used to sign session cookies)
   - Add `NOTIFY_TO_EMAIL` (your inbox for new request alerts, e.g. `you@borealisreptiles.com`)
   - Add `RESEND_FROM_EMAIL` (sender, e.g. `Borealis Reptiles <hello@borealisreptiles.com>`)
6. In the same project, add a **secret**:
   - `RESEND_API_KEY` (from [Resend](https://resend.com))
7. In the dashboard → **Settings → Functions → D1 bindings**, make sure `DB` is bound to `borealis-db`.

### Local development with the real backend

```bash
npm run dev
# → http://localhost:8788
```

This runs Pages Functions locally against a local D1 emulator (data in `.wrangler/`). Same code as production.

---

## 3. Project layout

```
index.html           Public homepage (hero, pairs, care, contact)
profile.html         Animal profile page (?id=N)
admin.html           Admin dashboard
assets/
  styles.css         Design system
  data.js            Data layer — API in prod, localStorage locally
  site.js            Homepage behavior
  profile.js         Profile page behavior
  admin.js           Admin behavior
functions/           Cloudflare Pages Functions (the backend)
  _lib/helpers.js    Auth, JSON, HMAC session cookies
  api/health.js
  api/auth/*         login / logout / me
  api/animals/*      CRUD
  api/pairs/*        CRUD
  api/requests/*     public POST, admin GET/PATCH/DELETE
schema.sql           D1 schema
seed.sql             Demo seed data
wrangler.toml        Cloudflare config
package.json
```

---

## 4. Adding new reptiles (not just ball pythons)

In the admin **Animals** panel, the *Category* dropdown supports `snake`, `lizard`, `gecko`, `turtle`, `other`. *Species* is free-text (e.g. "Leopard Gecko", "Corn Snake", "Bearded Dragon") and *Gene* is also free-text so you can describe morphs however you like.

A breeder adult is any animal with `Role = breeder`. Those become selectable as sires/dams when adding offspring, and as parents when creating breeding pairs.

---

## 5. Images

You can either:

- **Paste a URL** into the *Image URL* field (any publicly-hosted image works).
- **Use a path** like `imgs/snakes/opal.jpg` — just drop the file into the `imgs/snakes/` folder and redeploy.

> Future upgrade: bind a Cloudflare R2 bucket and add an upload endpoint. The current admin already accepts URLs so this is a no-code workaround until then.

---

## 6. Custom domain

Your `CNAME` file is already set to `www.borealisreptiles.com`. After the first Pages deploy, point your domain's CNAME to the Pages domain in your Cloudflare dashboard.
