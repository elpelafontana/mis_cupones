"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="pagina-login">
      <form className="ticket ticket--login" onSubmit={manejarEnvio}>
        <div className="ticket__body ticket__body--login">
          <span className="eyebrow">Acceso</span>
          <h1 className="titulo-app">Mis Cupones</h1>
          <p className="subtitulo-login">Ingresá para ver tus códigos guardados.</p>
        </div>
        <div className="ticket__divider" />
        <div className="ticket__stub ticket__stub--login">
          <label className="campo">
            <span>Usuario</span>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoFocus
              autoComplete="username"
              required
            />
          </label>
          <label className="campo">
            <span>Contraseña</span>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="mensaje-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="boton-primario" disabled={cargando}>
            {cargando ? "Entrando…" : "Entrar"}
          </button>
        </div>
      </form>
    </main>
  );
}
