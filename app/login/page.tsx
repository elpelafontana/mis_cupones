import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verificarTokenSesion, NOMBRE_COOKIE_SESION } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOMBRE_COOKIE_SESION)?.value;
  const sesion = await verificarTokenSesion(token);

  if (sesion) redirect("/dashboard");

  return <LoginForm />;
}
