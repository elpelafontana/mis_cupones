"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FormularioCodigo, { type ValoresFormulario } from "./FormularioCodigo";
import CodigoTicket from "./CodigoTicket";
import type { Codigo } from "./tipos";

// Compara ignorando mayúsculas/minúsculas y acentos, para que buscar "jose"
// encuentre "José" sin que el usuario tenga que tipear la tilde.
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function DashboardPage() {
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<Codigo | null>(null);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const router = useRouter();

  const cargarCodigos = useCallback(async () => {
    const res = await fetch("/api/codigos");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setCodigos(data);
    setCargando(false);
  }, [router]);

  useEffect(() => {
    cargarCodigos();
  }, [cargarCodigos]);

  async function manejarGuardar(valores: ValoresFormulario) {
    setError("");
    const esEdicion = editando !== null;
    const url = esEdicion ? `/api/codigos/${editando.id}` : "/api/codigos";
    const metodo = esEdicion ? "PUT" : "POST";
    const cuerpo = esEdicion ? { ...valores, usado: editando.usado === 1 } : valores;

    const res = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo guardar el código");
      return;
    }

    setMostrarFormulario(false);
    setEditando(null);
    cargarCodigos();
  }

  async function manejarEliminar(id: number) {
    if (!confirm("¿Eliminar este código? No se puede deshacer.")) return;
    await fetch(`/api/codigos/${id}`, { method: "DELETE" });
    cargarCodigos();
  }

  async function manejarToggleUsado(codigo: Codigo) {
    await fetch(`/api/codigos/${codigo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: codigo.codigo,
        beneficiario: codigo.beneficiario,
        descripcion: codigo.descripcion || "",
        tipo_descuento: codigo.tipo_descuento,
        valor: codigo.valor,
        categoria: codigo.categoria || "",
        fecha_expiracion: codigo.fecha_expiracion || "",
        usado: codigo.usado !== 1,
      }),
    });
    cargarCodigos();
  }

  async function cerrarSesion() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function abrirEdicion(codigo: Codigo) {
    setEditando(codigo);
    setMostrarFormulario(true);
    setError("");
  }

  function abrirNuevo() {
    setEditando(null);
    setMostrarFormulario(true);
    setError("");
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setEditando(null);
    setError("");
  }

  const busquedaNormalizada = normalizar(busqueda.trim());
  const codigosFiltrados = busquedaNormalizada
    ? codigos.filter(
        (c) =>
          normalizar(c.codigo).includes(busquedaNormalizada) ||
          normalizar(c.beneficiario).includes(busquedaNormalizada)
      )
    : codigos;

  const activos = codigosFiltrados.filter((c) => c.usado !== 1);
  const usados = codigosFiltrados.filter((c) => c.usado === 1);

  return (
    <main className="pagina-dashboard">
      <header className="encabezado">
        <h1 className="titulo-app titulo-app--chico">Mis Cupones</h1>
        <div className="acciones-encabezado">
          <button type="button" className="boton-primario" onClick={abrirNuevo}>
            + Nuevo código
          </button>
          <button type="button" className="boton-fantasma" onClick={cerrarSesion}>
            Salir
          </button>
        </div>
      </header>

      {mostrarFormulario && (
        <FormularioCodigo
          valoresIniciales={editando}
          onGuardar={manejarGuardar}
          onCancelar={cerrarFormulario}
          error={error}
        />
      )}

      {codigos.length > 0 && (
        <div className="barra-busqueda">
          <svg
            className="icono-busqueda"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
            <line x1="13.6" y1="13.6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="campo-busqueda"
            placeholder="Buscar por código o beneficiario…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar cupón por código o beneficiario"
          />
          {busqueda && (
            <button
              type="button"
              className="boton-limpiar-busqueda"
              onClick={() => setBusqueda("")}
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>
      )}

      {cargando ? (
        <p className="estado-vacio">Cargando…</p>
      ) : codigos.length === 0 ? (
        <div className="estado-vacio">
          <p>Todavía no guardaste ningún código.</p>
          <p>Usá &quot;+ Nuevo código&quot; para agregar el primero.</p>
        </div>
      ) : codigosFiltrados.length === 0 ? (
        <div className="estado-vacio">
          <p>No encontramos ningún código para &quot;{busqueda}&quot;.</p>
        </div>
      ) : (
        <>
          {activos.length > 0 && (
            <section>
              <h2 className="titulo-seccion">Activos ({activos.length})</h2>
              <div className="grilla-codigos">
                {activos.map((c) => (
                  <CodigoTicket
                    key={c.id}
                    codigo={c}
                    onEditar={() => abrirEdicion(c)}
                    onEliminar={() => manejarEliminar(c.id)}
                    onToggleUsado={() => manejarToggleUsado(c)}
                  />
                ))}
              </div>
            </section>
          )}
          {usados.length > 0 && (
            <section>
              <h2 className="titulo-seccion">Usados ({usados.length})</h2>
              <div className="grilla-codigos">
                {usados.map((c) => (
                  <CodigoTicket
                    key={c.id}
                    codigo={c}
                    onEditar={() => abrirEdicion(c)}
                    onEliminar={() => manejarEliminar(c.id)}
                    onToggleUsado={() => manejarToggleUsado(c)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
