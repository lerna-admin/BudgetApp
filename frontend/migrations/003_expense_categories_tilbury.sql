-- Mark Tilbury inspired budgeting buckets and categories
-- Bucket mapping: 50% Essentials, 25% Growth, 15% Stability, 10% Rewards

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  bucket TEXT NOT NULL, -- essentials, growth, stability, rewards, income, debt
  type TEXT NOT NULL CHECK (type IN ('income','expense','saving','investment','debt','transfer','reward','stability')),
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_subcategories (
  id UUID PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  edges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- wipe existing catalog (idempotent-ish)
DELETE FROM expense_subcategories;
DELETE FROM expense_categories;

-- Income bucket
INSERT INTO expense_categories (id, name, bucket, type, icon) VALUES
  ('11111111-1111-1111-1111-111111111111','Ingresos','income','income','💰');

INSERT INTO expense_subcategories (id, category_id, name, edges) VALUES
  ('11111111-1111-1111-1111-111111111112','11111111-1111-1111-1111-111111111111','Salario fijo','{"Nómina","Bonos","Horas extra"}'),
  ('11111111-1111-1111-1111-111111111113','11111111-1111-1111-1111-111111111111','Freelance / Side hustle','{"Servicios","Productos","Propinas"}'),
  ('11111111-1111-1111-1111-111111111114','11111111-1111-1111-1111-111111111111','Ingresos pasivos','{"Dividendos","Intereses","Regalías","Renta"}'),
  ('11111111-1111-1111-1111-111111111115','11111111-1111-1111-1111-111111111111','Otros ingresos','{"Reembolsos","Venta de activos","Regalos"}');

-- Essentials (50%)
INSERT INTO expense_categories (id, name, bucket, type, icon) VALUES
  ('22222222-2222-2222-2222-222222222221','Vivienda','essentials','expense','🏠'),
  ('22222222-2222-2222-2222-222222222222','Transporte','essentials','expense','🚗'),
  ('22222222-2222-2222-2222-222222222223','Alimentación','essentials','expense','🍽️'),
  ('22222222-2222-2222-2222-222222222224','Servicios y Comunicaciones','essentials','expense','📡'),
  ('22222222-2222-2222-2222-222222222225','Salud','essentials','expense','🩺'),
  ('22222222-2222-2222-2222-222222222226','Seguros','essentials','expense','🛡️'),
  ('22222222-2222-2222-2222-222222222227','Educación básica','essentials','expense','📚'),
  ('22222222-2222-2222-2222-222222222228','Dependientes','essentials','expense','🧒'),
  ('22222222-2222-2222-2222-222222222229','Mascotas','essentials','expense','🐾'),
  ('22222222-2222-2222-2222-22222222222a','Impuestos y tasas','essentials','expense','💸');

INSERT INTO expense_subcategories (id, category_id, name, edges) VALUES
  -- Vivienda
  ('22222222-2222-2222-2222-222222222231','22222222-2222-2222-2222-222222222221','Arriendo/Hipoteca','{"Arriendo","Hipoteca","HOA/Administración"}'),
  ('22222222-2222-2222-2222-222222222232','22222222-2222-2222-2222-222222222221','Mantenimiento hogar','{"Reparaciones","Muebles","Electrodomésticos"}'),
  -- Transporte
  ('22222222-2222-2222-2222-222222222233','22222222-2222-2222-2222-222222222222','Vehículo propio','{"Combustible","Mantenimiento","Seguro vehicular","Parqueadero/Peajes"}'),
  ('22222222-2222-2222-2222-222222222234','22222222-2222-2222-2222-222222222222','Transporte público / apps','{"Transporte público","Ride-hailing","Bicicleta/Patineta"}'),
  -- Alimentación
  ('22222222-2222-2222-2222-222222222235','22222222-2222-2222-2222-222222222223','Mercado','{"Supermercado","Plaza","Suscripciones comida"}'),
  ('22222222-2222-2222-2222-222222222236','22222222-2222-2222-2222-222222222223','Restaurantes/Domicilios','{"Restaurantes","Cafés","Domicilios"}'),
  -- Servicios y comunicaciones
  ('22222222-2222-2222-2222-222222222237','22222222-2222-2222-2222-222222222224','Utilities','{"Energía","Agua","Gas"}'),
  ('22222222-2222-2222-2222-222222222238','22222222-2222-2222-2222-222222222224','Comunicaciones','{"Internet","Celular","TV/Streaming"}'),
  -- Salud
  ('22222222-2222-2222-2222-222222222239','22222222-2222-2222-2222-222222222225','Atención médica','{"Consultas","Medicamentos","Laboratorios"}'),
  ('22222222-2222-2222-2222-22222222223a','22222222-2222-2222-2222-222222222225','Bienestar','{"Gimnasio","Terapia","Seguros complementarios"}'),
  -- Seguros
  ('22222222-2222-2222-2222-22222222223b','22222222-2222-2222-2222-222222222226','Seguros obligatorios','{"Salud","Vehículo","Hogar"}'),
  ('22222222-2222-2222-2222-22222222223c','22222222-2222-2222-2222-222222222226','Seguros opcionales','{"Vida","Discapacidad","Dispositivos"}'),
  -- Educación
  ('22222222-2222-2222-2222-22222222223d','22222222-2222-2222-2222-222222222227','Colegios/Universidad','{"Matrícula","Útiles","Transporte escolar"}'),
  -- Dependientes
  ('22222222-2222-2222-2222-22222222223e','22222222-2222-2222-2222-222222222228','Cuidado','{"Niñera","Adulto mayor","Guardería"}'),
  -- Mascotas
  ('22222222-2222-2222-2222-22222222223f','22222222-2222-2222-2222-222222222229','Cuidados mascota','{"Alimento","Veterinario","Accesorios"}'),
  -- Impuestos
  ('22222222-2222-2222-2222-222222222240','22222222-2222-2222-2222-22222222222a','Obligaciones','{"Impuesto renta","Predial","Rodamiento"}');

-- Growth / Inversión (25%)
INSERT INTO expense_categories (id, name, bucket, type, icon) VALUES
  ('33333333-3333-3333-3333-333333333331','Inversión','growth','investment','📈');

INSERT INTO expense_subcategories (id, category_id, name, edges) VALUES
  ('33333333-3333-3333-3333-333333333332','33333333-3333-3333-3333-333333333331','Indexados/Bolsa','{"ETF amplio","Fondos índice","Acciones"}'),
  ('33333333-3333-3333-3333-333333333333','33333333-3333-3333-3333-333333333331','Bienes raíces','{"REIT","Arriendo","Crowdfunding"}'),
  ('33333333-3333-3333-3333-333333333334','33333333-3333-3333-3333-333333333331','Negocio/Side hustle','{"Marketing","Inventario","Herramientas"}'),
  ('33333333-3333-3333-3333-333333333335','33333333-3333-3333-3333-333333333331','Alternativos','{"Cripto (<=5%)","Metales","Coleccionables"}');

-- Stability / Ahorro (15%)
INSERT INTO expense_categories (id, name, bucket, type, icon) VALUES
  ('44444444-4444-4444-4444-444444444441','Estabilidad','stability','saving','🧱');

INSERT INTO expense_subcategories (id, category_id, name, edges) VALUES
  ('44444444-4444-4444-4444-444444444442','44444444-4444-4444-4444-444444444441','Fondo de emergencia','{"1 mes","3 meses","6 meses"}'),
  ('44444444-4444-4444-4444-444444444443','44444444-4444-4444-4444-444444444441','Sinking funds','{"Mantenimiento carro","Suscripciones anuales","Gastos médicos mayores"}'),
  ('44444444-4444-4444-4444-444444444444','44444444-4444-4444-4444-444444444441','Protección extra','{"Seguros vida","Invalidez","Coberturas deducible"}'),
  ('44444444-4444-4444-4444-444444444445','44444444-4444-4444-4444-444444444441','Deuda prioritaria','{"Snowball","Avalancha","Tarjeta alta tasa"}');

-- Rewards / Discrecional (10%)
INSERT INTO expense_categories (id, name, bucket, type, icon) VALUES
  ('55555555-5555-5555-5555-555555555551','Recompensas','rewards','reward','🎉');

INSERT INTO expense_subcategories (id, category_id, name, edges) VALUES
  ('55555555-5555-5555-5555-555555555552','55555555-5555-5555-5555-555555555551','Ocio y experiencias','{"Viajes","Salidas","Eventos"}'),
  ('55555555-5555-5555-5555-555555555553','55555555-5555-5555-5555-555555555551','Restaurantes premium','{"Fine dining","Celebraciones"}'),
  ('55555555-5555-5555-5555-555555555554','55555555-5555-5555-5555-555555555551','Hobbies y gadgets','{"Tecnología","Cursos personales","Equipos"}'),
  ('55555555-5555-5555-5555-555555555555','55555555-5555-5555-5555-555555555551','Regalos y donaciones','{"Regalos","Donaciones","Apoyo familiar"}');

-- Debt (para seguimiento de pagos)
INSERT INTO expense_categories (id, name, bucket, type, icon) VALUES
  ('66666666-6666-6666-6666-666666666661','Deudas','debt','debt','💳');

INSERT INTO expense_subcategories (id, category_id, name, edges) VALUES
  ('66666666-6666-6666-6666-666666666662','66666666-6666-6666-6666-666666666661','Tarjetas de crédito','{"Avalancha","Snowball"}'),
  ('66666666-6666-6666-6666-666666666663','66666666-6666-6666-6666-666666666661','Préstamos consumo','{"Vehículo","Personal","Nómina"}'),
  ('66666666-6666-6666-6666-666666666664','66666666-6666-6666-6666-666666666661','Estudios','{"Crédito ICETEX","Universidad"}'),
  ('66666666-6666-6666-6666-666666666665','66666666-6666-6666-6666-666666666661','Hipoteca','{"Cuota","Seguros asociados"}');
