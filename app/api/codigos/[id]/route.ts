import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Contexto = { params: Promise<{ id: string }> };

type CuerpoCodigo = {
  codigo?: string;
  beneficiario?: string;
  descripcion?: string | null;
  tipo_descuento?: string;
  valor?: number | string;
  categoria?: string | null;
  fecha_expiracion?: string | null;
  usado?: boolean;
};

export async function PUT(request: Request, { params }: Contexto) {
  const { id } = await params;
  let body: CuerpoCodigo;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (!body.codigo?.trim() || !body.beneficiario?.trim()) {
    return NextResponse.json({ error: "Código y beneficiario son obligatorios" }, { status: 400 });
  }

  const valorNum = Number(body.valor);
  if (Number.isNaN(valorNum) || valorNum <= 0) {
    return NextResponse.json({ error: "El valor debe ser un número mayor a 0" }, { status: 400 });
  }

  const conexion = await db();
  await conexion.execute({
    sql: `UPDATE codigos_descuento
          SET codigo = ?, beneficiario = ?, descripcion = ?, tipo_descuento = ?, valor = ?,
              categoria = ?, fecha_expiracion = ?, usado = ?
          WHERE id = ?`,
    args: [
      body.codigo.trim(),
      body.beneficiario.trim(),
      body.descripcion?.trim() || null,
      body.tipo_descuento || "porcentaje",
      valorNum,
      body.categoria?.trim() || null,
      body.fecha_expiracion || null,
      body.usado ? 1 : 0,
      id,
    ],
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Contexto) {
  const { id } = await params;
  const conexion = await db();
  await conexion.execute({
    sql: "DELETE FROM codigos_descuento WHERE id = ?",
    args: [id],
  });
  return NextResponse.json({ ok: true });
}
