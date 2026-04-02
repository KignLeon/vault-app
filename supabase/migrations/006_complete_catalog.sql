-- ================================================
-- GASCLUB247 — Supabase Migration 006
-- Complete Google Drive Catalog Import
-- Adds 10 new products + updates existing with images
-- ================================================

-- ── UPDATE existing products with Cloudinary image URLs ────────────────────────
UPDATE public.products SET image_url = 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/indoors/rainbow-belts.jpg' WHERE sku = 'TC-RB-01' AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/indoors/lemon-berry-gelato.jpg' WHERE sku = 'TC-LBG-01' AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/indoors/blue-jam.jpg' WHERE sku = 'TC-BJ-01' AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/greenhouse/zalato.jpg' WHERE sku = 'TC-ZAL-01' AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/greenhouse/white-gummies.jpg' WHERE sku = 'TC-WG-01' AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/greenhouse/gumbo.jpg' WHERE sku = 'TC-GUM-01' AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/greenhouse/galactic-gummies.jpg' WHERE sku = 'TC-GG-01' AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/greenhouse/candy-runtz.jpg' WHERE sku = 'TC-CR-01' AND (image_url IS NULL OR image_url = '');
UPDATE public.products SET image_url = 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/greenhouse/67-runtz.jpg' WHERE sku = 'TC-67R-01' AND (image_url IS NULL OR image_url = '');

-- ── INSERT new products from Google Drive (Folder 2 — Website Flower Pics) ─────

INSERT INTO public.products (sku, name, category, image_url, images, price, stock, status, description, tags, featured, bulk_tiers, viewers, recent_orders) VALUES

-- 🧊 PREMIUM / INDOOR (from Drive: Pre + Ins folders)
('TC-MR-01', 'MONCLER RUNTZ', 'premium', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/premium/moncler-runtz.jpg', '[]', 135, 10, 'low-stock', 'Designer-tier Runtz phenotype. Ultra-dense, frosty, with loud candy-gas nose. Premium indoor.', '["runtz","premium","designer","indoor"]', false, '[{"label":"QP","qty":"1/4 LB","price":400},{"label":"HP","qty":"1/2 LB","price":750},{"label":"LB","qty":"1 LB","price":1400}]', 22, 6),
('TC-VER-01', 'VERSACE', 'premium', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/premium/versace.jpg', '[]', 138, 8, 'low-stock', 'Named for luxury — premium indoor flower with exotic terpene expression. Gold-standard bag appeal.', '["luxury","premium","exotic","indoor"]', false, '[{"label":"QP","qty":"1/4 LB","price":400},{"label":"HP","qty":"1/2 LB","price":750},{"label":"LB","qty":"1 LB","price":1400}]', 24, 7),
('TC-PN-01', 'PURPLE NERDS', 'premium', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/premium/purple-nerds.jpg', '[]', 130, 12, 'in-stock', 'Grape candy profile with deep purple hues. Sweet, fruity, and visually stunning. Premium indoor.', '["purple","candy","fruity","indoor"]', false, '[{"label":"QP","qty":"1/4 LB","price":400},{"label":"HP","qty":"1/2 LB","price":750},{"label":"LB","qty":"1 LB","price":1400}]', 17, 4),
('TC-LCS-01', 'LEMON CHERRY SHERBET', 'premium', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/premium/lemon-cherry-sherbet.jpg', '[]', 132, 10, 'in-stock', 'Lemon x Cherry Sherbet cross. Tangy citrus nose with a sweet cherry finish. Frosty and dense.', '["lemon","cherry","sherbet","premium"]', false, '[{"label":"QP","qty":"1/4 LB","price":400},{"label":"HP","qty":"1/2 LB","price":750},{"label":"LB","qty":"1 LB","price":1400}]', 19, 5),

-- 🍭 EXOTIC (from Drive: Exo folders)
('TC-RK-01', 'RAINBOW KANDY', 'exotic', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/exotic/rainbow-kandy.jpg', '[]', 128, 14, 'in-stock', 'Vibrant candy rainbow terpenes with a sweet, colorful nose. Dense frosty nugs with eye-catching appeal.', '["candy","rainbow","exotic"]', false, '[{"label":"QP","qty":"1/4 LB","price":400},{"label":"HP","qty":"1/2 LB","price":750},{"label":"LB","qty":"1 LB","price":1400}]', 16, 4),
('TC-GTP-01', 'GASTOPIA', 'exotic', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/exotic/gastopia.jpg', '[]', 132, 10, 'low-stock', 'Utopian gas profile. Deep, pungent, with a smooth creamy finish. Limited exotic batch.', '["gas","exotic","creamy"]', false, '[{"label":"QP","qty":"1/4 LB","price":400},{"label":"HP","qty":"1/2 LB","price":750},{"label":"LB","qty":"1 LB","price":1400}]', 19, 5),
('TC-LCG85-01', 'LCG 85', 'exotic', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/exotic/lcg-85-sml.jpg', '[]', 130, 8, 'low-stock', 'Lemon Cherry Gelato phenotype #85. Exceptional terpene expression with ultra-dense trichome coverage.', '["gelato","lemon","cherry","premium"]', false, '[{"label":"QP","qty":"1/4 LB","price":400},{"label":"HP","qty":"1/2 LB","price":750},{"label":"LB","qty":"1 LB","price":1400}]', 22, 6),

-- 🍬 CANDY (from Drive: Exo Candy Drop Sml)
('TC-CD-01', 'CANDY DROP', 'candy', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/exotic/candy-drop-sml.jpg', '[]', 108, 20, 'in-stock', 'Sweet candy drop profile. Light, approachable, with sugar-coated terpenes and a clean finish.', '["candy","sweet","light"]', false, '[{"label":"QP","qty":"1/4 LB","price":300},{"label":"HP","qty":"1/2 LB","price":550},{"label":"LB","qty":"1 LB","price":1000}]', 10, 3),

-- 📦 SMALLS (from Drive: Exo Sml folders)
('TC-ZALS-01', 'ZALATO SMALLS', 'smalls', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/exotic/zalato-sml.jpg', '[]', 85, 30, 'in-stock', 'Zalato in small bud format. Same sweet Zkittlez x Gelato terps at a value price point.', '["smalls","gelato","value"]', false, '[{"label":"QP","qty":"1/4 LB","price":300},{"label":"HP","qty":"1/2 LB","price":550},{"label":"LB","qty":"1 LB","price":1000}]', 10, 3),
('TC-BJS-01', 'BLUE JAM SMALLS', 'smalls', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/exotic/blue-jam-sml.jpg', '[]', 82, 28, 'in-stock', 'Blue Jam in small bud format. Blueberry jam sweetness at bulk-friendly pricing.', '["smalls","blueberry","value"]', false, '[{"label":"QP","qty":"1/4 LB","price":300},{"label":"HP","qty":"1/2 LB","price":550},{"label":"LB","qty":"1 LB","price":1000}]', 8, 2),

-- 🔥 PRE-ROLLS (from Drive: Prerolls folder)
('TC-WH-PR', 'WARHEADZ PRE-ROLL', 'prerolls', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/pre-rolls/warheadz-preroll.jpg', '[]', 15, 50, 'in-stock', 'Warheadz in pre-rolled form. Sour candy punch, quick light, even burn.', '["preroll","sour","gas"]', false, NULL, 13, 4),
('TC-SL-PR', 'SUPREME LATTO PRE-ROLL', 'prerolls', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/pre-rolls/supreme-latto-preroll.jpg', '[]', 18, 40, 'in-stock', 'Supreme Latto pre-rolled. Sweet pastry terps, hand-packed for premium smoke.', '["preroll","exotic","pastry"]', false, NULL, 16, 5),
('TC-PP-PR', 'PINK PANTHER PRE-ROLL', 'prerolls', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/pre-rolls/pink-panther-preroll.jpg', '[]', 15, 35, 'in-stock', 'Pink Panther pre-rolled. Smooth fruity profile, ready to go.', '["preroll","fruity","smooth"]', false, NULL, 11, 3),
('TC-LDR-PR', 'LEMON DIOR RUNTZ PRE-ROLL', 'prerolls', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/pre-rolls/lemondiorruntz-preroll.jpg', '[]', 18, 30, 'in-stock', 'Lemon Dior Runtz pre-rolled. Exotic lemon-forward profile, perfectly packed.', '["preroll","lemon","exotic"]', false, NULL, 14, 4),
('TC-BP-PR', 'BERRY POP PRE-ROLL', 'prerolls', 'https://res.cloudinary.com/ddnhp0hzd/image/upload/v1/gasclub247/products/pre-rolls/berry-pop-preroll.jpg', '[]', 15, 45, 'in-stock', 'Berry Pop pre-rolled. Sweet mixed berry burst, smooth and consistent.', '["preroll","berry","fruity"]', false, NULL, 9, 3)

ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  status = EXCLUDED.status,
  featured = EXCLUDED.featured,
  bulk_tiers = EXCLUDED.bulk_tiers;
