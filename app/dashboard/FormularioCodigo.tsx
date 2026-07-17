"use client";

import { useState, type FormEvent } from "react";
import type { Codigo } from "./tipos";

export type ValoresFormulario = {
  codigo: string;
  beneficiario: string;
  descripcion: string;
  tipo_descuento: "porcentaje" | "monto_fijo";
  valor: string;
  categoria: string;
  fecha_expiracion: string;
};

const LARGO_CODIGO_GENERADO = 8;
// Sin 0/O/1/I/L: son letras y números que se confunden fácil al leerlos o tipearlos.
const CARACTERES_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generarCodigo(): string {
  let resultado = "";
  for (let i = 0; i < LARGO_CODIGO_GENERADO; i++) {
    resultado += CARACTERES_CODIGO[Math.floor(Math.random() * CARACTERES_CODIGO.length)];
  }
  return resultado;
}

export default function FormularioCodigo({
  valoresIniciales,
  onGuardar,
  onCancelar,
  error,
}: {
  valoresIniciales: Codigo | null;
  onGuardar: (valores: ValoresFormulario) => void;
  onCancelar: () => void;
  error: string;
}) {
  const [valores, setValores] = useState<ValoresFormulario>({
    codigo: valoresIniciales?.codigo || "",
    beneficiario: valoresIniciales?.beneficiario || "",
    descripcion: valoresIniciales?.descripcion || "",
    tipo_descuento: valoresIniciales?.tipo_descuento || "porcentaje",
    valor: valoresIniciales ? String(valoresIniciales.valor) : "",
    categoria: valoresIniciales?.categoria || "",
    fecha_expiracion: valoresIniciales?.fecha_expiracion || "",
  });

  function actualizar<K extends keyof ValoresFormulario>(campo: K, valor: ValoresFormulario[K]) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    onGuardar(valores);
  }

  return (
    <form className="ticket ticket--formulario" onSubmit={manejarEnvio}>
      <div className="ticket__body">
        <span className="eyebrow">{valoresIniciales ? "Editar código" : "Nuevo código"}</span>
        <div className="grilla-formulario">
          <label className="campo">
            <span>Beneficiario</span>
            <input
              value={valores.beneficiario}
              onChange={(e) => actualizar("beneficiario", e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="campo">
            <span>Código</span>
            <div className="fila-codigo">
              <input
                value={valores.codigo}
                onChange={(e) => actualizar("codigo", e.target.value.toUpperCase())}
                maxLength={10}
                required
              />
              <button
                type="button"
                className="boton-generar-codigo"
                onClick={() => actualizar("codigo", generarCodigo())}
              >
                Generar
              </button>
            </div>
          </label>
          <label className="campo">
            <span>Tipo</span>
            <select
              value={valores.tipo_descuento}
              onChange={(e) =>
                actualizar("tipo_descuento", e.target.value as ValoresFormulario["tipo_descuento"])
              }
            >
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="monto_fijo">Monto fijo ($)</option>
            </select>
          </label>
          <label className="campo">
            <span>Valor</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valores.valor}
              onChange={(e) => actualizar("valor", e.target.value)}
              required
            />
          </label>
          <label className="campo">
            <span>Categoría (opcional)</span>
            <input
              value={valores.categoria}
              onChange={(e) => actualizar("categoria", e.target.value)}
              placeholder="Ropa, tecnología…"
            />
          </label>
          <label className="campo">
            <span>Vencimiento (opcional)</span>
            <input
              type="date"
              value={valores.fecha_expiracion}
              onChange={(e) => actualizar("fecha_expiracion", e.target.value)}
            />
          </label>
          <label className="campo campo--ancho">
            <span>Descripción (opcional)</span>
            <input
              value={valores.descripcion}
              onChange={(e) => actualizar("descripcion", e.target.value)}
              placeholder="Envío gratis en compras mayores a…"
            />
          </label>
        </div>
        {error && (
          <p className="mensaje-error" role="alert">
            {error}
          </p>
        )}
        <div className="acciones-formulario">
          <button type="submit" className="boton-primario">
            Guardar
          </button>
          <button type="button" className="boton-fantasma" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}
