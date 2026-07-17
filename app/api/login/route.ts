import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  crearTokenSesion,
  NOMBRE_COOKIE_SESION,
  DURACION_SESION_SEGUNDOS,
  obtenerHashContrasena,
} from "@/lib/auth";
import {
  obtenerIdentificador,
  verificarBloqueo,
  registrarIntentoFallido,
  limpiarIntentos,
  formatearEspera,
  DURACION_BLOQUEO_MINUTOS,
} from "@/lib/limiteIntentos";

export async function POST(request: Request) {
  const identificador = obtenerIdentificador(request);

  const bloqueo = await verificarBloqueo(identificador);
  if (bloqueo.bloqueado) {
    return NextResponse.json(
      {
        error: `Demasiados intentos fallidos. Probá de nuevo en ${formatearEspera(bloqueo.segundosRestantes)}.`,
        segundosRestantes: bloqueo.segundosRestantes,
      },
      { status: 429 }
    );
  }

  let body: { usuario?: string; contrasena?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const { usuario, contrasena } = body;
  const usuarioEsperado = process.env.AUTH_USER;
  const hashEsperado = obtenerHashContrasena();

  if (!usuarioEsperado || !hashEsperado) {
    return NextResponse.json(
      { error: "El servidor no tiene configuradas las credenciales (AUTH_USER / AUTH_PASSWORD_HASH)." },
      { status: 500 }
    );
  }

  if (!usuario || !contrasena) {
    return NextResponse.json({ error: "Faltan usuario o contraseña" }, { status: 400 });
  }

  const usuarioValido = usuario === usuarioEsperado;
  // Siempre corremos bcrypt.compare, aunque el usuario ya sea inválido,
  // para no filtrar por tiempo de respuesta si el usuario existe o no.
  const contrasenaValida = await bcrypt.compare(contrasena, hashEsperado);

  if (!usuarioValido || !contrasenaValida) {
    const { intentosRestantes, recienBloqueado } = await registrarIntentoFallido(identificador);

    if (recienBloqueado) {
      return NextResponse.json(
        {
          error: `Demasiados intentos fallidos. Probá de nuevo en ${formatearEspera(
            DURACION_BLOQUEO_MINUTOS * 60
          )}.`,
        },
        { status: 429 }
      );
    }

    const aviso =
      intentosRestantes <= 2
        ? ` Te quedan ${intentosRestantes} intento${intentosRestantes === 1 ? "" : "s"}.`
        : "";
    return NextResponse.json(
      { error: `Usuario o contraseña incorrectos.${aviso}` },
      { status: 401 }
    );
  }

  await limpiarIntentos(identificador);

  const token = await crearTokenSesion(usuario);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(NOMBRE_COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DURACION_SESION_SEGUNDOS,
    path: "/",
  });
  return response;
}

