import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verificarTokenSesion, NOMBRE_COOKIE_SESION } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOMBRE_COOKIE_SESION)?.value;
  const sesion = await verificarTokenSesion(token);

  redirect(sesion ? "/dashboard" : "/login");
}
