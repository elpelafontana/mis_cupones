import { NextResponse, type NextRequest } from "next/server";
import { verificarTokenSesion, NOMBRE_COOKIE_SESION } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(NOMBRE_COOKIE_SESION)?.value;
  const sesion = await verificarTokenSesion(token);

  const esRutaApi = request.nextUrl.pathname.startsWith("/api/codigos");

  if (!sesion) {
    if (esRutaApi) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/codigos/:path*"],
};
