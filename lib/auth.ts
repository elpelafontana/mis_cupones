import { SignJWT, jwtVerify } from "jose";

const NOMBRE_COOKIE = "session";
const DURACION_SESION = 60 * 60 * 24 * 7; // 7 días, en segundos

function obtenerSecreto(): Uint8Array {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) {
    // Solo para no romper "npm run dev" si todavía no configuraste nada.
    // En producción, definí JWT_SECRET sí o sí (ver README).
    console.warn(
      "JWT_SECRET no está definida. Usando un valor temporal solo apto para desarrollo local."
    );
    return new TextEncoder().encode("valor-temporal-de-desarrollo-no-usar-en-produccion");
  }
  return new TextEncoder().encode(secreto);
}

export async function crearTokenSesion(usuario: string): Promise<string> {
  return new SignJWT({ usuario })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION}s`)
    .sign(obtenerSecreto());
}

export async function verificarTokenSesion(
  token: string | undefined
): Promise<{ usuario: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, obtenerSecreto());
    if (typeof payload.usuario === "string") {
      return { usuario: payload.usuario };
    }
    return null;
  } catch {
    return null;
  }
}

export const NOMBRE_COOKIE_SESION = NOMBRE_COOKIE;
export const DURACION_SESION_SEGUNDOS = DURACION_SESION;

// AUTH_PASSWORD_HASH se guarda codificado en base64 (ver scripts/hash-password.mjs)
// porque el hash de bcrypt trae signos "$" que el cargador de variables de
// entorno puede llegar a interpretar como una expansión y corromper el valor.
export function obtenerHashContrasena(): string | undefined {
  const valor = process.env.AUTH_PASSWORD_HASH;
  if (!valor) return undefined;
  try {
    return Buffer.from(valor, "base64").toString("utf8");
  } catch {
    return undefined;
  }
}
