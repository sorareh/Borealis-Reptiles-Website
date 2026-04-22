-- Seed data for Borealis Reptiles.
-- Run AFTER schema.sql:
--   npx wrangler d1 execute borealis-db --file=seed.sql
-- This mirrors the original hardcoded breeding pairs so the new backend
-- starts with the same content.

DELETE FROM purchase_requests;
DELETE FROM breeding_pairs;
DELETE FROM animals;
DELETE FROM merchandise;
DELETE FROM care_sheets;
DELETE FROM sqlite_sequence WHERE name IN ('animals','breeding_pairs','purchase_requests','merchandise','care_sheets');

-- Breeder adults
INSERT INTO animals (id, name, category, species, sex, gene, role, status, image_url, description) VALUES
  (1, 'Nagini',  'snake', 'Ball Python', 'female', 'Pastel',    'breeder', 'breeder', 'imgs/snakes/emerald.jpg', 'Our flagship Pastel female. Consistently produces stunning clutches.'),
  (2, 'Opal',    'snake', 'Ball Python', 'male',   'Mojave',    'breeder', 'breeder', 'imgs/snakes/opal.jpg',    'Calm-tempered Mojave male with exceptional pattern.'),
  (3, 'Axinite', 'snake', 'Ball Python', 'male',   'Spider',    'breeder', 'breeder', 'imgs/snakes/back1.jpg',   'Spider male with tight pattern and bright coloration.'),
  (4, 'Jasper',  'snake', 'Ball Python', 'male',   'Pinstripe', 'breeder', 'breeder', 'imgs/snakes/jasper.jpg',  'Clean pinstripe male, great temperament.'),
  (5, 'Peridot', 'snake', 'Ball Python', 'female', 'Mojave',    'breeder', 'breeder', 'imgs/snakes/quartize.jpg','Proven Mojave female.');

-- Breeding pairs
INSERT INTO breeding_pairs (id, male_id, female_id, description) VALUES
  (1, 2, 1, 'Pastel × Mojave — produces Pastel Mojaves, Pastels, Mojaves, and Normals.'),
  (2, 3, 1, 'Pastel × Spider — bumblebees, pastels, spiders.'),
  (3, 4, 5, 'Pinstripe × Mojave — pinstripe mojaves and cleaner pinstripes.');

-- Offspring (babies) from pair 1  (Opal × Nagini)
INSERT INTO animals (code, category, species, gene, role, status, price, image_url, father_id, mother_id, description) VALUES
  ('NAOP01','snake','Ball Python','Pastel Mojave','offspring','available',   250, 'imgs/snakes/amber.jpg',   2, 1, 'Beautiful pastel mojave hatchling.'),
  ('NAOP02','snake','Ball Python','Pastel',       'offspring','available',   150, 'imgs/snakes/emerald.jpg', 2, 1, 'Bright pastel, feeds reliably on f/t hoppers.'),
  ('NAOP03','snake','Ball Python','Mojave',       'offspring','sold',        200, 'imgs/snakes/jasper.jpg',  2, 1, 'Classic Mojave expression.'),
  ('NAOP04','snake','Ball Python','Normal',       'offspring','available',   100, 'imgs/snakes/opal.jpg',    2, 1, 'Great starter snake with excellent disposition.');

-- Offspring from pair 2 (Axinite × Nagini)
INSERT INTO animals (code, category, species, gene, role, status, price, image_url, father_id, mother_id, description) VALUES
  ('NAAX01','snake','Ball Python','Bumblebee',    'offspring','available',   300, 'imgs/snakes/quartize.jpg',3, 1, 'Bumblebee (Pastel Spider).'),
  ('NAAX02','snake','Ball Python','Pastel',       'offspring','available',   150, 'imgs/snakes/zoiste.jpg', 3, 1, 'Clean pastel female.'),
  ('NAAX03','snake','Ball Python','Spider',       'offspring','sold',        180, 'imgs/snakes/back1.jpg',   3, 1, 'Spider male.'),
  ('NAAX04','snake','Ball Python','Normal',       'offspring','available',   100, 'imgs/snakes/amber.jpg',   3, 1, 'Normal — perfect starter snake.');

-- Offspring from pair 3 (Jasper × Peridot)
INSERT INTO animals (code, category, species, gene, role, status, price, image_url, father_id, mother_id, description) VALUES
  ('JAPE01','snake','Ball Python','Pinstripe Mojave','offspring','available',320, 'imgs/snakes/emerald.jpg', 4, 5, 'Striking pinstripe mojave combo.'),
  ('JAPE02','snake','Ball Python','Pinstripe',      'offspring','available',220, 'imgs/snakes/jasper.jpg',  4, 5, 'Clean pinstripe.'),
  ('JAPE03','snake','Ball Python','Mojave',         'offspring','available',200, 'imgs/snakes/quartize.jpg',4, 5, 'Bright mojave.'),
  ('JAPE04','snake','Ball Python','Normal',         'offspring','sold',       100, 'imgs/snakes/opal.jpg',   4, 5, 'Normal.');

-- Merchandise (handmade by Sara)
INSERT INTO merchandise (code, name, type, material, shed_source, description, image_url, price, status, featured, sort_order) VALUES
  ('NECK-001','Emerald Shed Necklace',   'necklace', 'Stainless steel', 'Nagini',  'Delicate pendant set with a preserved snake shed from Nagini. Each piece is one of a kind.', 'imgs/merchandise/merch1.jpg', 89.99,  'available', 1, 1),
  ('HEAD-002','Mojave Shed Headband',    'headband', 'Leather + brass', 'Opal',    'Handmade leather headband accented with a preserved shed section.', 'imgs/merchandise/merch2.jpg', 129.99, 'available', 1, 2),
  ('BRAC-003','Spider Shed Bracelet',    'bracelet', 'Sterling silver', 'Axinite', 'Braided silver with a tiny vial of shed. Adjustable.', 'imgs/merchandise/merch3.jpg', 149.99, 'available', 1, 3),
  ('EARR-004','Amber Shed Drop Earrings','earrings', 'Gold-plated',     'Nagini',  'Drop earrings with a fragment of amber pastel shed.', 'imgs/snakes/amber.jpg',       119.99, 'available', 0, 4),
  ('NECK-005','Emerald Pendant',         'necklace', 'Sterling silver', 'Peridot', 'Mojave-pattern shed in a crystal pendant.', 'imgs/snakes/emerald.jpg',  199.99, 'available', 0, 5),
  ('BRAC-006','Onyx Shed Bracelet',      'bracelet', 'Stainless steel + onyx', 'Axinite', 'Stainless steel bracelet with onyx and a fragment of preserved shed.', 'imgs/snakes/quartize.jpg', 249.99, 'available', 0, 6);

-- Care sheets
INSERT INTO care_sheets (slug, title, summary, content, sort_order) VALUES
  ('ball-python',   'Ball Python',   'The classic beginner snake — docile, hardy and easy to keep.',
   'Temperature: 78–82°F ambient, 88–92°F basking
Humidity: 55–65%
Feeding: Weekly for juveniles, every 10–14 days for adults. Frozen-thawed rodents only.
Enclosure: 40-gallon (4''×2''×1.5'') minimum for an adult
Substrate: Cypress mulch, coco husk or a mix
Hides: At least two (one on the warm side, one on the cool side)
Water: Clean, chlorine-free water at all times — big enough to soak in
Handling: Short daily sessions once settled; skip the week after a feed', 1),
  ('corn-snake',    'Corn Snake',    'Active, colourful and very forgiving — a great first snake.',
   'Temperature: 75–82°F ambient, 85–88°F basking
Humidity: 40–50%
Feeding: Weekly for juveniles, every 10–14 days for adults
Enclosure: 20-gallon long minimum, 40+ for large adults
Substrate: Aspen shavings or cypress mulch
Hides: At least two, plus climbing branches
Water: Medium bowl — they don''t typically soak
Handling: Tolerates daily handling once settled', 2),
  ('leopard-gecko', 'Leopard Gecko', 'A calm, ground-dwelling gecko that rarely bites.',
   'Warm end: ~90°F (UTH + thermostat)
Cool end: 70–75°F
Humidity: 30–40% ambient with a humid hide at 60–70%
Feeding: Crickets, mealworms or dubia roaches dusted with calcium + D3
Enclosure: 20-gallon long minimum for a single adult
Substrate: Slate tile, reptile carpet, or paper towel
Hides: Three — warm, cool, and humid
Water: Shallow dish, always clean', 3);
