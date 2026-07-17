import { db } from "@/lib/db";

export const UMBRAL_INTENTOS = 5;
export const DURACION_BLOQUEO_MINUTOS = 15;

// Los timestamps se guardan como los devuelve datetime('now') de SQLite:
// UTC, formato "YYYY-MM-DD HH:MM:SS". Estos helpers convierten entre eso y
// objetos Date de JS sin depender de la zona horaria del servidor.
function aFechaSQLite(fecha: Date): string {
  return fecha.toISOString().slice(0, 19).replace("T", " ");
}

function desdeFechaSQLite(valor: string): Date {
  return new Date(`${valor.replace(" ", "T")}Z`);
}

export function obtenerIdentificador(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const primera = forwardedFor.split(",")[0]?.trim();
    if (primera) return primera;
  }
  return request.headers.get("x-real-ip") || "desconocido";
}

export async function verificarBloqueo(
  identificador: string
): Promise<{ bloqueado: boolean; segundosRestantes: number }> {
  const conexion = await db();
  const resultado = await conexion.execute({
    sql: "SELECT bloqueado_hasta FROM intentos_login WHERE identificador = ?",
    args: [identificador],
  });

  const fila = resultado.rows[0] as unknown as { bloqueado_hasta: string | null } | undefined;
  if (!fila?.bloqueado_hasta) {
    return { bloqueado: false, segundosRestantes: 0 };
  }

  const restanteMs = desdeFechaSQLite(fila.bloqueado_hasta).getTime() - Date.now();
  if (restanteMs > 0) {
    return { bloqueado: true, segundosRestantes: Math.ceil(restanteMs / 1000) };
  }
  return { bloqueado: false, segundosRestantes: 0 };
}

/** Suma un intento fallido. Devuelve cuántos intentos le quedan antes de bloquearse. */
export async function registrarIntentoFallido(
  identificador: string
): Promise<{ intentosRestantes: number; recienBloqueado: boolean }> {
  const conexion = await db();
  const resultado = await conexion.execute({
    sql: "SELECT intentos, bloqueado_hasta FROM intentos_login WHERE identificador = ?",
    args: [identificador],
  });

  const fila = resultado.rows[0] as unknown as
    | { intentos: number; bloqueado_hasta: string | null }
    | undefined;

  // Solo reseteamos el contador si HABÍA un bloqueo y ya venció. Si nunca
  // hubo bloqueo (bloqueado_hasta null) simplemente seguimos sumando.
  let intentosPrevios = 0;
  if (fila) {
    const bloqueoVencido = fila.bloqueado_hasta
      ? desdeFechaSQLite(fila.bloqueado_hasta).getTime() <= Date.now()
      : false;
    intentosPrevios = bloqueoVencido ? 0 : Number(fila.intentos);
  }
  const nuevosIntentos = intentosPrevios + 1;
  const seBloquea = nuevosIntentos >= UMBRAL_INTENTOS;

  await conexion.execute({
    sql: `
      INSERT INTO intentos_login (identificador, intentos, bloqueado_hasta, ultimo_intento)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(identificador) DO UPDATE SET
        intentos = excluded.intentos,
        bloqueado_hasta = excluded.bloqueado_hasta,
        ultimo_intento = excluded.ultimo_intento
    `,
    args: [
      identificador,
      nuevosIntentos,
      seBloquea ? aFechaSQLite(new Date(Date.now() + DURACION_BLOQUEO_MINUTOS * 60_000)) : null,
      aFechaSQLite(new Date()),
    ],
  });

  return {
    intentosRestantes: Math.max(0, UMBRAL_INTENTOS - nuevosIntentos),
    recienBloqueado: seBloquea,
  };
}

/** Se llama tras un login exitoso: borra el historial de intentos de ese identificador. */
export async function limpiarIntentos(identificador: string): Promise<void> {
  const conexion = await db();
  await conexion.execute({
    sql: "DELETE FROM intentos_login WHERE identificador = ?",
    args: [identificador],
  });
}

export function formatearEspera(segundos: number): string {
  const minutos = Math.ceil(segundos / 60);
  if (minutos <= 1) return "menos de un minuto";
  return `${minutos} minutos`;
}
