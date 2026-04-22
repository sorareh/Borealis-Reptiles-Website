-- Borealis Reptiles - Cloudflare D1 schema
-- Run with: npx wrangler d1 execute borealis-db --file=schema.sql

-- ---------------------------------------------------------------
-- animals: every reptile (breeder OR offspring) lives in this table
--   Self-referential parent IDs build the family tree.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS animals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT UNIQUE,                -- human-readable code (e.g. NAOP01)
  name          TEXT,                        -- display name (e.g. Nagini)
  category      TEXT NOT NULL DEFAULT 'snake',  -- snake | lizard | turtle | gecko | other
  species       TEXT,                        -- e.g. Ball Python, Corn Snake, Leopard Gecko
  sex           TEXT,                        -- male | female | unknown
  gene          TEXT,                        -- morph / gene, e.g. Pastel Mojave
  birth_date    TEXT,                        -- ISO yyyy-mm-dd
  weight        TEXT,
  description   TEXT,
  image_url     TEXT,                        -- relative or absolute URL
  price         REAL,                        -- null or 0 if not for sale
  status        TEXT NOT NULL DEFAULT 'available',  -- available | reserved | sold | not_for_sale | breeder
  role          TEXT NOT NULL DEFAULT 'offspring',  -- breeder | offspring
  mother_id     INTEGER,
  father_id     INTEGER,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mother_id) REFERENCES animals(id) ON DELETE SET NULL,
  FOREIGN KEY (father_id) REFERENCES animals(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_animals_mother   ON animals(mother_id);
CREATE INDEX IF NOT EXISTS idx_animals_father   ON animals(father_id);
CREATE INDEX IF NOT EXISTS idx_animals_role     ON animals(role);
CREATE INDEX IF NOT EXISTS idx_animals_status   ON animals(status);
CREATE INDEX IF NOT EXISTS idx_animals_category ON animals(category);

-- ---------------------------------------------------------------
-- breeding_pairs: explicit pairing used for the "Breeding Pairs" album
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS breeding_pairs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  male_id      INTEGER NOT NULL,
  female_id    INTEGER NOT NULL,
  title        TEXT,           -- optional override, else "<male> × <female>"
  description  TEXT,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (male_id)   REFERENCES animals(id) ON DELETE CASCADE,
  FOREIGN KEY (female_id) REFERENCES animals(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- purchase_requests: buy requests + general questions
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_requests (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  animal_id        INTEGER,
  animal_code      TEXT,
  inquiry_type     TEXT DEFAULT 'buy',     -- buy | question
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  customer_phone   TEXT,
  shipping_address TEXT,
  message          TEXT,
  status           TEXT DEFAULT 'new',     -- new | contacted | completed | declined
  created_at       TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_animal ON purchase_requests(animal_id);

-- ---------------------------------------------------------------
-- merchandise: jewelry and goods crafted by Sara, often from snake sheds
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchandise (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT UNIQUE,             -- optional SKU, e.g. "NECK-001"
  name        TEXT NOT NULL,           -- e.g. "Onyx Shed Necklace"
  type        TEXT NOT NULL,           -- necklace | bracelet | earrings | headband | ring | keychain | other
  material    TEXT,                    -- free text: "Stainless steel", "Sterling silver", "Leather", ...
  shed_source TEXT,                    -- which snake the shed came from (free text, e.g. "Onyx")
  description TEXT,
  image_url   TEXT,
  price       REAL,
  status      TEXT NOT NULL DEFAULT 'available', -- available | sold | reserved | not_for_sale
  featured    INTEGER NOT NULL DEFAULT 0,        -- 1 = show on homepage
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_merch_featured ON merchandise(featured);
CREATE INDEX IF NOT EXISTS idx_merch_status   ON merchandise(status);

-- ---------------------------------------------------------------
-- care_sheets: editable husbandry guides shown on the homepage
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS care_sheets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT UNIQUE,             -- e.g. "ball-python"
  title       TEXT NOT NULL,           -- e.g. "Ball Python"
  summary     TEXT,                    -- short 1-line description
  content     TEXT,                    -- body text (line-break preserved)
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_care_sort ON care_sheets(sort_order);
