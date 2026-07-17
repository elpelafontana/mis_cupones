"use client";

import { useState } from "react";
import type { Codigo } from "./tipos";

function formatearValor(codigo: Codigo) {
  return codigo.tipo_descuento === "porcentaje"
    ? `${codigo.valor}% OFF`
    : `$${codigo.valor} OFF`;
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return null;
  const d = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function CodigoTicket({
  codigo,
  onEditar,
  onEliminar,
  onToggleUsado,
}: {
  codigo: Codigo;
  onEditar: () => void;
  onEliminar: () => void;
  onToggleUsado: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const esUsado = codigo.usado === 1;
  const fecha = formatearFecha(codigo.fecha_expiracion);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Si el navegador bloquea el portapapeles, no rompemos el resto de la UI.
    }
  }

  return (
    <article className={`ticket ${esUsado ? "ticket--usado" : ""}`}>
      <div className="ticket__body">
        {codigo.categoria && <span className="eyebrow">{codigo.categoria}</span>}
        <h3 className="ticket__beneficiario">{codigo.beneficiario}</h3>
        <p className="ticket__valor">{formatearValor(codigo)}</p>
        {codigo.descripcion && <p className="ticket__descripcion">{codigo.descripcion}</p>}
      </div>
      <div className="ticket__divider" />
      <div className="ticket__stub">
        <button type="button" className="ticket__codigo" onClick={copiar}>
          {copiado ? "¡Copiado!" : codigo.codigo}
        </button>
        {fecha && <p className="ticket__vencimiento">Vence {fecha}</p>}
        <div className="ticket__acciones">
          <button type="button" onClick={copiar}>
            {copiado ? "¡Copiado!" : "Copiar código"}
          </button>
          <button type="button" onClick={onToggleUsado}>
            {esUsado ? "Marcar activo" : "Marcar usado"}
          </button>
          <button type="button" onClick={onEditar}>
            Editar
          </button>
          <button type="button" onClick={onEliminar} className="accion-eliminar">
            Eliminar
          </button>
        </div>
      </div>
    </article>
  );
}
