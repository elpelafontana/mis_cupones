import { createClient, type Client } from "@libsql/client";

// Si TURSO_DATABASE_URL no está configurada (por ejemplo, en desarrollo
// local antes de crear la base en Turso), se usa un archivo SQLite local.
// Así podés programar y probar sin depender de internet.
const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

let client: Client | null = null;
let inicializada = false;

function obtenerCliente(): Client {
  if (!client) {
    client = createClient(
      authToken ? { url, authToken } : { url }
    );
  }
  return client;
}

async function asegurarEsquema(db: Client) {
  if (inicializada) return;
  await db.execute(`
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
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS intentos_login (
      identificador TEXT PRIMARY KEY,
      intentos INTEGER NOT NULL DEFAULT 0,
      bloqueado_hasta TEXT,
      ultimo_intento TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  inicializada = true;
}

export async function db(): Promise<Client> {
  const cliente = obtenerCliente();
  await asegurarEsquema(cliente);
  return cliente;
}
