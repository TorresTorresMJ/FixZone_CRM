-- Migration 14: Importar inventario inicial sucursal Puerto Vallarta
-- Fuente: Reporte SICAR 11/05/2026 - 25/05/2026 (orden de compra de referencia)
-- unit_cost = precio de costo; sale_price = mismo (placeholder — actualizar según corresponda)
-- product_type: refaccion (REFACCIONES), insumo (HERRAMIENTA)
-- Ejecutar en Supabase SQL Editor

INSERT INTO public.products (name, sku, category, product_type, stock, unit_cost, sale_price, branch_id)
SELECT
  v.name::text,
  v.sku::text,
  v.category::text,
  v.product_type::text,
  v.stock::numeric,
  v.unit_cost::numeric,
  v.unit_cost::numeric AS sale_price,
  (SELECT id FROM public.branches WHERE name ILIKE '%Puerto Vallarta%' LIMIT 1) AS branch_id
FROM (VALUES
  -- ── HERRAMIENTAS ────────────────────────────────────────────────────
  ('CAJA ORGANIZADORA SUNSHINE P/48',         'HERHER12188', 'Herramienta', 'insumo',    1, 223),
  ('CINTA ALUMINIO 5MM/ 20M',                 'HERHER52775', 'Herramienta', 'insumo',    1,  61),
  ('DISPENSADOR DE ALCOHOL VIDRIO RELIFE',    'HERHER11646', 'Herramienta', 'insumo',    1,  95),
  ('ESPATULA CUCHILLO MULTIUSOS P/ QUITAR',   'HERHER55069', 'Herramienta', 'insumo',    1,  69),
  ('GUANTES ANTIESTATICOS TALLA L MECHANIC',  'HERHER43260', 'Herramienta', 'insumo',    1,  41),
  ('HILO PARA JUMPER SUNSHINE SS-007E 0.007', 'HERHER19918', 'Herramienta', 'insumo',    1,  85),
  ('HILO PARA JUMPER SUNSHINE SS-007E 0.009', 'ACCSIN19915', 'Herramienta', 'insumo',    1,  85),
  ('HILO SEPARADOR SUNSHINE SS-051 0.03MM',   'HERHER28721', 'Herramienta', 'insumo',    1,  30),
  ('LIMPIADOR DE CAUTIN RELIFE RL-461',       'HERHER44436', 'Herramienta', 'insumo',    1,  95),
  ('LIQUIDO QUITA GOMA 250ML',                'HERHER49614', 'Herramienta', 'insumo',    1,  69),
  ('MINI ORGANIZADOR DE CELULARES SS-001A',   'HERHER30828', 'Herramienta', 'insumo',    2,  49),
  ('MULTICARGADOR RELIFE RL-304S 8 PUERTOS',  'HERHER39045', 'Herramienta', 'insumo',    1, 675),
  ('PINZAS DE PRECISION RELIFE RT-14A',       'HERHER60032', 'Herramienta', 'insumo',    1,  82),
  ('PINZAS DE PRECISION RELIFE RT-14SA',      'HERHER64471', 'Herramienta', 'insumo',    1,  82),
  ('SOPORTE DE LOGICA SUNSHINE SS601B',       'HERHER46297', 'Herramienta', 'insumo',    1, 160),
  ('SOPORTE UNIVERSAL PARA TELEFONO',         'HERHER90218', 'Herramienta', 'insumo',    1, 590),

  -- ── CARCASAS ────────────────────────────────────────────────────────
  ('CARCASA COMPLETA IPHONE 11 PRO MAX',      'REFTAP69265', 'Tapas',       'refaccion', 1, 801),
  ('CARCASA COMPLETA IPHONE 11 PRO NEGRO',    'REFTAP78070', 'Tapas',       'refaccion', 1, 483),
  ('CARCASA COMPLETA IPHONE 8 PLUS BLANCO',   'REFTAP69412', 'Tapas',       'refaccion', 1, 264),
  ('CARCASA COMPLETA IPHONE 8 PLUS ROJO',     'REFTAP83735', 'Tapas',       'refaccion', 1, 261),
  ('CARCASA COMPLETA IPHONE 8G NEGRO',        'REFTAP85509', 'Tapas',       'refaccion', 1, 154),
  ('CARCASA COMPLETA IPHONE XR NEGRO',        'REFTAP81682', 'Tapas',       'refaccion', 1, 267),
  ('CARCASA COMPLETA IPHONE XS MAX NEGRO',    'REFTAP66783', 'Tapas',       'refaccion', 1, 485),

  -- ── FLEX AURICULAR ──────────────────────────────────────────────────
  ('FLEX AURICULAR SENSOR DE LUZ (A)',        'REFAUR82185', 'Auricular',   'refaccion', 2,  78),
  ('FLEX AURICULAR SENSOR DE LUZ (B)',        'REFAUR22283', 'Auricular',   'refaccion', 3,  91),

  -- ── FLEX DE CARGA ───────────────────────────────────────────────────
  ('FLEX DE CARGA IPHONE 12 PRO',             'SERSER67565', 'Flex de Carga','refaccion', 2,  70),
  ('FLEX DE CARGA IPHONE X',                  'REFFLE92971', 'Flex de Carga','refaccion', 2,  55),
  ('FLEX DE CARGA IPHONE XR',                 'SINSIN52933', 'Flex de Carga','refaccion', 2,  61),

  -- ── GORILA GLASS SMARTWATCH ─────────────────────────────────────────
  ('GORILA GLASS APPLE SMARTWATCH C/OCA S7 (A)', 'REFGOR74163', 'Gorila Glass','refaccion', 1, 49),
  ('GORILA GLASS APPLE SMARTWATCH C/OCA S7 (B)', 'REFGOR92151', 'Gorila Glass','refaccion', 1, 49),
  ('GORILA GLASS APPLE SMARTWATCH C/OCA S8',  'REFGOR29082', 'Gorila Glass','refaccion', 1,  52),
  ('GORILA GLASS APPLE SMARTWATCH C/OCA',     'REFGOR94364', 'Gorila Glass','refaccion', 2,  84),

  -- ── GORILA GLASS IPHONE ─────────────────────────────────────────────
  ('GORILA GLASS IPHONE 11 NEGRO CON OCA',       'REFGLA86182', 'Gorila Glass','refaccion', 3, 58),
  ('GORILA GLASS IPHONE 11 PRO NEGRO CON OCA',   'REFGLA44858', 'Gorila Glass','refaccion', 3, 72),
  ('GORILA GLASS IPHONE 12 NEGRO CON OCA',       'REFGOR57026', 'Gorila Glass','refaccion', 1, 81),
  ('GORILA GLASS IPHONE 12 PRO NEGRO CON OCA',   'REFGOR74286', 'Gorila Glass','refaccion', 1, 79),
  ('GORILA GLASS IPHONE 13 MINI NEGRO C/OCA',    'REFGOR55738', 'Gorila Glass','refaccion', 1, 44),
  ('GORILA GLASS IPHONE 13 NEGRO C/OCA',         'REFGOR95994', 'Gorila Glass','refaccion', 2, 53),
  ('GORILA GLASS IPHONE 14 CON OCA',             'REFGOR78738', 'Gorila Glass','refaccion', 3, 80),
  ('GORILA GLASS IPHONE 14 PRO CON OCA',         'REFGOR39011', 'Gorila Glass','refaccion', 3, 80),
  ('GORILA GLASS IPHONE 14 PRO MAX CON OCA',     'REFGOR22822', 'Gorila Glass','refaccion', 3, 80),
  ('GORILA GLASS IPHONE X CON OCA NEGRO',        'REFGOR87846', 'Gorila Glass','refaccion', 3, 51),
  ('GORILA GLASS IPHONE XR CON OCA NEGRO',       'REFGOR80490', 'Gorila Glass','refaccion', 2, 58),
  ('GORILA GLASS IPHONE XS MAX CON OCA',         'REFGOR21121', 'Gorila Glass','refaccion', 3, 63),

  -- ── LCD ─────────────────────────────────────────────────────────────
  ('LCD IPHONE 12 PRO MAX OLED GX RM',        'REFLCD99060', 'LCD', 'refaccion',  1,  920),
  ('LCD IPHONE 13 PRO MAX OLED GX SIN IC',    'REFLCD95425', 'LCD', 'refaccion',  1, 1923),
  ('LCD IPHONE 13 PRO OLED DD C.C.',          'REFLCD61649', 'LCD', 'refaccion',  1, 2100),
  ('LCD IPHONE 14 INCELL TC RM',              'REFLCD53268', 'LCD', 'refaccion',  1,  434),
  ('LCD IPHONE 14 OLED GX RM',               'REFLCD32988', 'LCD', 'refaccion',  1,  768),
  ('LCD IPHONE 14 PLUS OLED GX NEGRO RM',    'REFLCD26774', 'LCD', 'refaccion',  1, 1102),
  ('LCD IPHONE 15 OLED GX RM',               'REFLCD99311', 'LCD', 'refaccion',  1, 1923),
  ('LCD IPHONE 15 PRO OLED GX SIN IC RM',    'REFLCD36576', 'LCD', 'refaccion',  2, 2805),
  ('LCD IPHONE 7 PLUS BLANCO C.C.',          'REFDIS21893', 'LCD', 'refaccion',  1,  140),
  ('LCD IPHONE 7 PLUS NEGRO C.C.',           'REFLCD78927', 'LCD', 'refaccion',  1,  137),
  ('LCD IPHONE 7G BLANCO C.C.',              'REFLCD99101', 'LCD', 'refaccion',  2,  135),
  ('LCD IPHONE 7G NEGRO C.C.',               'REFLCD19790', 'LCD', 'refaccion',  1,  138),
  ('LCD IPHONE 8 PLUS NEGRO C.C.',           'REFLCD44081', 'LCD', 'refaccion',  2,  147),
  ('LCD IPHONE XS MAX OLED C.C.',            'REFLCD33265', 'LCD', 'refaccion',  1,  585),

  -- ── TAPAS IPHONE 11 ─────────────────────────────────────────────────
  ('TAPA IPHONE 11 PRO BLANCO HIGH OEM',      'REFTAP43434', 'Tapas', 'refaccion', 2, 57),
  ('TAPA IPHONE 11 PRO MAX BLANCO HIGH OEM',  'REFTAP18751', 'Tapas', 'refaccion', 2, 38),
  ('TAPA IPHONE 11 PRO MAX DORADO',           'REFTAP79290', 'Tapas', 'refaccion', 3, 47),
  ('TAPA IPHONE 11 PRO MAX NEGRO HIGH OEM',   'REFTAP99429', 'Tapas', 'refaccion', 2, 39),
  ('TAPA IPHONE 11 PRO MAX VERDE HIGH OEM',   'REFTAP27643', 'Tapas', 'refaccion', 2, 31),
  ('TAPA IPHONE 11 PRO NEGRO HIGH OEM',       'SINSIN91660', 'Tapas', 'refaccion', 2, 41),
  ('TAPA IPHONE 11 PRO ROSA HIGH OEM',        'REFTAP56243', 'Tapas', 'refaccion', 1, 36),
  ('TAPA IPHONE 11 PRO VERDE HIGH OEM',       'REFTAP77841', 'Tapas', 'refaccion', 2, 51),

  -- ── TAPAS IPHONE 12 ─────────────────────────────────────────────────
  ('TAPA IPHONE 12 BLANCO HIGH',              'REFTAP91474', 'Tapas', 'refaccion', 2, 23),
  ('TAPA IPHONE 12 MINI AZUL HIGH',           'REFTAP13476', 'Tapas', 'refaccion', 2, 69),
  ('TAPA IPHONE 12 MINI BLANCO HIGH',         'REFTAP58040', 'Tapas', 'refaccion', 2, 69),
  ('TAPA IPHONE 12 MINI MORADO',              'REFTAP64513', 'Tapas', 'refaccion', 3, 29),
  ('TAPA IPHONE 12 MINI NEGRO HIGH',          'REFTAP47697', 'Tapas', 'refaccion', 3, 26),
  ('TAPA IPHONE 12 MINI ROJO',               'REFTAP56527', 'Tapas', 'refaccion', 1, 59),
  ('TAPA IPHONE 12 MINI VERDE',              'REFTAP45211', 'Tapas', 'refaccion', 2, 28),
  ('TAPA IPHONE 12 PRO AZUL HIGH',           'REFTAP76880', 'Tapas', 'refaccion', 2, 34),
  ('TAPA IPHONE 12 PRO BLANCO',              'REFTAP51588', 'Tapas', 'refaccion', 2, 29),
  ('TAPA IPHONE 12 PRO DORADO HIGH',         'REFTAP63474', 'Tapas', 'refaccion', 2, 35),
  ('TAPA IPHONE 12 PRO MAX BLANCO',          'REFTAP88862', 'Tapas', 'refaccion', 2, 34),
  ('TAPA IPHONE 12 PRO MAX DORADO HIGH',     'REFTAP39295', 'Tapas', 'refaccion', 1, 38),
  ('TAPA IPHONE 12 PRO MAX NEGRO',           'REFTAP46239', 'Tapas', 'refaccion', 2, 39),
  ('TAPA IPHONE 12 PRO NEGRO',              'REFTAP91198', 'Tapas', 'refaccion', 1, 43),
  ('TAPA IPHONE 12 ROJO',                   'REFTAP37152', 'Tapas', 'refaccion', 2, 20),

  -- ── TAPAS IPHONE 13 ─────────────────────────────────────────────────
  ('TAPA IPHONE 13 MINI AZUL',              'REFTAP49471', 'Tapas', 'refaccion', 3, 56),
  ('TAPA IPHONE 13 MINI BLANCO',            'REFTAP40933', 'Tapas', 'refaccion', 2, 22),
  ('TAPA IPHONE 13 MINI NEGRO/AZUL',        'REFTAP46122', 'Tapas', 'refaccion', 1, 33),
  ('TAPA IPHONE 13 MINI ROJO',              'REFTAP13377', 'Tapas', 'refaccion', 2, 31),
  ('TAPA IPHONE 13 MINI ROSA',              'REFTAP87165', 'Tapas', 'refaccion', 2, 27),
  ('TAPA IPHONE 13 MINI VERDE',             'SINSIN27881', 'Tapas', 'refaccion', 3, 31),
  ('TAPA IPHONE 13 PRO DORADO',             'SINTAP52766', 'Tapas', 'refaccion', 1, 42),
  ('TAPA IPHONE 13 PRO MAX AZUL',           'REFTAP14271', 'Tapas', 'refaccion', 2, 31),
  ('TAPA IPHONE 13 PRO MAX BLANCO',         'REFTAP68050', 'Tapas', 'refaccion', 2, 36),
  ('TAPA IPHONE 13 PRO MAX DORADO',         'REFBAT74801', 'Tapas', 'refaccion', 2, 31),
  ('TAPA IPHONE 13 PRO MAX VERDE',          'REFTAP62941', 'Tapas', 'refaccion', 2, 47),
  ('TAPA IPHONE 13 PRO NEGRO',              'REFTAP16959', 'Tapas', 'refaccion', 3, 50),
  ('TAPA IPHONE 13 PRO VERDE',              'REFTAP95930', 'Tapas', 'refaccion', 1, 48),

  -- ── TAPAS IPHONE 14 ─────────────────────────────────────────────────
  ('TAPA IPHONE 14 PRO MAX DORADO',         'REFTAP73389', 'Tapas', 'refaccion', 2, 41),

  -- ── TAPAS IPHONE 8 / SE ─────────────────────────────────────────────
  ('TAPA IPHONE 8 PLUS BLANCO',             'REFTAP97222', 'Tapas', 'refaccion', 2, 21),
  ('TAPA IPHONE 8 PLUS NEGRO',              'REFTAP11253', 'Tapas', 'refaccion', 2, 12),
  ('TAPA IPHONE 8 PLUS ROJO',               'REFTAP21787', 'Tapas', 'refaccion', 2, 20),
  ('TAPA IPHONE 8 PLUS ROSA',               'REFTAP79684', 'Tapas', 'refaccion', 2, 17),
  ('TAPA IPHONE 8G/SE 2020 BLANCA',         'REFTAP21519', 'Tapas', 'refaccion', 1, 25),
  ('TAPA IPHONE 8G/SE 2020 ROSA/DORADO',    'REFTAP70288', 'Tapas', 'refaccion', 1, 35),

  -- ── TAPAS IPHONE XR / XS MAX ────────────────────────────────────────
  ('TAPA IPHONE XR AMARILLO',               'REFTAP16048', 'Tapas', 'refaccion', 2, 24),
  ('TAPA IPHONE XR AZUL',                   'REFTAP35526', 'Tapas', 'refaccion', 1, 18),
  ('TAPA IPHONE XR BLANCA',                 'REFTAP74919', 'Tapas', 'refaccion', 2, 17),
  ('TAPA IPHONE XR CORAL',                  'REFTAP44089', 'Tapas', 'refaccion', 1, 12),
  ('TAPA IPHONE XR ROJO',                   'REFTAP94171', 'Tapas', 'refaccion', 1, 24),
  ('TAPA IPHONE XS MAX BLANCA',             'REFTAP47765', 'Tapas', 'refaccion', 2, 26),
  ('TAPA IPHONE XS MAX DORADO/ROSA',        'REFTAP23979', 'Tapas', 'refaccion', 1, 17),
  ('TAPA IPHONE XS MAX NEGRA',              'REFTAP61709', 'Tapas', 'refaccion', 2, 36),

  -- ── TOUCH SMARTWATCH ────────────────────────────────────────────────
  ('TOUCH CON OCA APPLE SMARTWATCH S3/S2 (A)', 'REFTOU25237', 'Touch', 'refaccion', 2, 133),
  ('TOUCH CON OCA APPLE SMARTWATCH S3/S2 (B)', 'REFTOU34649', 'Touch', 'refaccion', 2, 133),
  ('TOUCH CON OCA APPLE SMARTWATCH S4 (A)',    'REFTOU16533', 'Touch', 'refaccion', 1, 134),
  ('TOUCH CON OCA APPLE SMARTWATCH S4 (B)',    'REFTOU64706', 'Touch', 'refaccion', 1, 122),
  ('TOUCH CON OCA APPLE SMARTWATCH S5 (A)',    'REFTOU40917', 'Touch', 'refaccion', 2, 100),
  ('TOUCH CON OCA APPLE SMARTWATCH S5 (B)',    'REFTOU68349', 'Touch', 'refaccion', 2,  92),
  ('TOUCH CON OCA APPLE SMARTWATCH S6 (A)',    'REFTOU72207', 'Touch', 'refaccion', 2,  87),
  ('TOUCH CON OCA APPLE SMARTWATCH S6 (B)',    'REFTOU31249', 'Touch', 'refaccion', 2, 109),
  ('TOUCH CON OCA APPLE SMARTWATCH SE',        'REFTOU24556', 'Touch', 'refaccion', 2,  67),

  -- ── TOUCH IPHONE ────────────────────────────────────────────────────
  ('TOUCH CON OCA IPHONE 11 PRO CALIDAD',      'REFTOU62724', 'Touch', 'refaccion', 2, 203),
  ('TOUCH CON OCA IPHONE X CALIDAD ORIGINAL',  'REFTOU48460', 'Touch', 'refaccion', 1, 146),
  ('TOUCH CON OCA IPHONE XR CALIDAD',          'REFTOU80919', 'Touch', 'refaccion', 1, 153),
  ('TOUCH CON OCA IPHONE XS CALIDAD',          'REFTOU55004', 'Touch', 'refaccion', 1, 148),
  ('TOUCH CON OCA IPHONE XS MAX CALIDAD',      'SIN11593152', 'Touch', 'refaccion', 1, 165)

) AS v(name, sku, category, product_type, stock, unit_cost)
ON CONFLICT (sku) DO NOTHING;

-- Verificación rápida post-insert
SELECT COUNT(*) AS productos_insertados FROM public.products
WHERE branch_id = (SELECT id FROM public.branches WHERE name ILIKE '%Puerto Vallarta%' LIMIT 1);
