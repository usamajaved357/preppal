-- Preppal seed data (real catalog from @preppal.swl, Nov 2026).
-- Prices marked 0 are UNKNOWN: set them in the admin panel before launch.
-- The API refuses to sell a variant whose price is 0.
-- Run: pnpm db:seed:local   (or db:seed:remote for production, once)

INSERT OR IGNORE INTO cities (id, name, slug, is_active) VALUES
  ('city_sahiwal', 'Sahiwal', 'sahiwal', 1);

-- TODO(Preppal): replace with the real delivery areas and fees.
INSERT OR IGNORE INTO delivery_areas (id, city_id, name, delivery_fee_pkr, is_active, sort_order) VALUES
  ('area_swl_city', 'city_sahiwal', 'Sahiwal city (set real areas in admin)', 0, 1, 0);

INSERT OR IGNORE INTO categories (id, name, slug, description, image_key, sort_order, is_active) VALUES
  ('cat_pastes',        'Pastes',          'pastes',          'Ginger-garlic & more',      '/images/products/ginger-garlic-paste.jpg', 1, 1),
  ('cat_peeled_garlic', 'Peeled garlic',   'peeled-garlic',   'Cleaned cloves',            '/images/products/peeled-garlic.jpg',       2, 1),
  ('cat_chopped',       'Chopped garlic',  'chopped-garlic',  'Finely minced',             '/images/products/chopped-garlic.jpg',      3, 1),
  ('cat_onion',         'Chopped onion',   'chopped-onion',   'Ready for tarka',           '/images/site/onions.jpg',                  4, 0),
  ('cat_bases',         'Masala bases',    'masala-bases',    'Kabab & curry bases',       '/images/products/kacha-qeema-kabab-base.jpg', 5, 1),
  ('cat_spices',        'Spice mixes',     'spice-mixes',     'Measured blends',           '/images/site/spices.jpg',                  6, 0),
  ('cat_marinated',     'Marinated fish',  'marinated',       'Ready to fry',              '/images/products/marinated-fish.jpg',      7, 1),
  ('cat_bbq',           'BBQ & tikka',     'bbq-tikka',       'Marinated for the grill',   '/images/site/grill.jpg',                   8, 0),
  ('cat_ready_fry',     'Ready to fry',    'ready-to-fry',    'Snacks & starters',         '/images/products/cheesy-chicken-cones.jpg',9, 1),
  ('cat_greens',        'Leafy greens',    'leafy-greens',    'Methi, palak & more',       '/images/products/chopped-methi.jpg',       10, 1),
  ('cat_seasonal',      'Seasonal veg',    'seasonal-veg',    'Matar & more',              '/images/products/gross-matar.jpg',         11, 1),
  ('cat_deals',         'Deal bundles',    'deals',           'Ramazan & Eid',             '/images/site/spread.jpg',                  12, 1);

INSERT OR IGNORE INTO products (id, category_id, name, slug, short_description, description, badge, image_keys, status, sort_order) VALUES
  ('prd_gg_paste', 'cat_pastes', 'Ginger-Garlic Paste', 'ginger-garlic-paste',
   'Freshly ground · ready to cook',
   'The essential base for every handi, karahi and qeema. Fresh ginger and garlic, ground the morning of delivery and packed in a sealed tub.',
   'Bestseller', '["/images/products/ginger-garlic-paste.jpg"]', 'active', 1),
  ('prd_peeled_garlic', 'cat_peeled_garlic', 'Peeled Garlic', 'peeled-garlic',
   'Cleaned, peeled cloves',
   'Whole garlic cloves, cleaned and peeled so they go straight into the pan.',
   NULL, '["/images/products/peeled-garlic.jpg"]', 'active', 2),
  ('prd_chopped_garlic', 'cat_chopped', 'Chopped Garlic', 'chopped-garlic',
   'Finely chopped, ready for tarka',
   'Freshly chopped garlic for tarka, stir-fries and marinades.',
   NULL, '["/images/products/chopped-garlic.jpg"]', 'active', 3),
  ('prd_kabab_base', 'cat_bases', 'Kacha Qeema Kabab Base', 'kacha-qeema-kabab-base',
   'Just mix with qeema, fry & enjoy',
   'Freshly prepared masala base for tasty, tangy and juicy kachay qeemay ke kabab. Pitmaster''s taste at home.',
   'Eid special', '["/images/products/kacha-qeema-kabab-base.jpg"]', 'active', 4),
  ('prd_marinated_fish', 'cat_marinated', 'Marinated Fish', 'marinated-fish',
   'Spiced and ready for the pan',
   'Fish marinated in Preppal''s masala — tasty and healthy for winter. Just fry or grill.',
   'Winter special', '["/images/products/marinated-fish.jpg"]', 'active', 5),
  ('prd_chicken_cones', 'cat_ready_fry', 'Cheesy Chicken Cones', 'cheesy-chicken-cones',
   'Ready to fry · cheesy & crunchy',
   'Ready-to-fry cheesy and crunchy chicken cones. Fry, serve and enjoy.',
   'Ready to fry', '["/images/products/cheesy-chicken-cones.jpg"]', 'active', 6),
  ('prd_chopped_methi', 'cat_greens', 'Chopped Methi', 'chopped-methi',
   'Washed & finely chopped',
   'Fresh methi, washed and chopped. Cooking ki tareef aap ki — hum bas aap ke backstage partner.',
   NULL, '["/images/products/chopped-methi.jpg"]', 'active', 7),
  ('prd_gross_matar', 'cat_seasonal', 'Gross Matar', 'gross-matar',
   'Big peas that keep their shape',
   'Big, fresh peas that hold their shape even after cooking in qeema — no mushy peas, wasted taste or wasted money.',
   'Seasonal', '["/images/products/gross-matar.jpg"]', 'active', 8);

-- TODO(Preppal): real pack sizes and prices.
INSERT OR IGNORE INTO product_variants (id, product_id, label, sku, price_pkr, unit_note, sort_order) VALUES
  ('var_gg_250',      'prd_gg_paste',       '250 g',   'GGP-250',  0,   '', 1),
  ('var_gg_500',      'prd_gg_paste',       '500 g',   'GGP-500',  0,   '', 2),
  ('var_peeled_250',  'prd_peeled_garlic',  '250 g',   'PGL-250',  0,   '', 1),
  ('var_peeled_500',  'prd_peeled_garlic',  '500 g',   'PGL-500',  0,   '', 2),
  ('var_chopg_250',   'prd_chopped_garlic', '250 g',   'CGL-250',  0,   '', 1),
  ('var_kabab_500',   'prd_kabab_base',     '500 g',   'KQB-500',  0,   '', 1),
  ('var_kabab_1000',  'prd_kabab_base',     '1 kg',    'KQB-1000', 0,   '', 2),
  ('var_fish_500',    'prd_marinated_fish', '500 g',   'MFS-500',  0,   '', 1),
  ('var_fish_1000',   'prd_marinated_fish', '1 kg',    'MFS-1000', 0,   '', 2),
  ('var_cones_6',     'prd_chicken_cones',  'Pack of 6','CCC-6',   0,   '', 1),
  ('var_methi_250',   'prd_chopped_methi',  '250 g',   'CMT-250',  0,   '', 1),
  ('var_matar_1000',  'prd_gross_matar',    '1 kg',    'GMT-1000', 190, 'per kg', 1);

INSERT OR IGNORE INTO inventory (variant_id, city_id, is_available, stock_qty, daily_limit)
  SELECT id, 'city_sahiwal', 1, NULL, NULL FROM product_variants;

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('cutoffHour', '23'),
  ('deliveryByLabel', '"5 PM"'),
  ('maxDaysAhead', '2'),
  ('minOrderPkr', '0'),
  ('whatsappNumber', '"923285228505"'),
  ('instagramHandle', '"preppal.swl"'),
  ('alertEmails', '[]');

INSERT OR IGNORE INTO counters (key, value) VALUES ('order_number', 0);

-- TODO(you): replace with the real owner email(s). Must match the Cloudflare Access login.
INSERT OR IGNORE INTO admin_users (id, email, name, role) VALUES
  ('adm_owner', 'owner@example.com', 'Owner', 'owner');
