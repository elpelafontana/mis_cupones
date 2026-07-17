import { NextResponse } from "next/server";
import { NOMBRE_COOKIE_SESION } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(NOMBRE_COOKIE_SESION);
  return response;
}
