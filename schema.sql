-- Esquema de la base de datos. Correlo una vez contra tu base de Turso:
--   turso db shell <tu-base> < schema.sql
-- (o pegalo en el "Shell" de tu base desde app.turso.tech)

CREATE TABLE IF NOT EXISTS codigos_descuento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL,
  beneficiario TEXT NOT NULL,
  descripcion TEXT,
  tipo_descuento TEXT NOT NULL CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
  valor REAL NOT NULL,
  categoria TEXT,
  fecha_expiracion TEXT,
  usado INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_codigos_creado_en ON codigos_descuento (creado_en DESC);

-- Registro de intentos de login fallidos, para poner un límite de reintentos.
-- "identificador" es la IP de quien intenta entrar.
CREATE TABLE IF NOT EXISTS intentos_login (
  identificador TEXT PRIMARY KEY,
  intentos INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta TEXT,
  ultimo_intento TEXT NOT NULL DEFAULT (datetime('now'))
);
