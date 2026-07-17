import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type CuerpoCodigo = {
  codigo?: string;
  beneficiario?: string;
  descripcion?: string | null;
  tipo_descuento?: string;
  valor?: number | string;
  categoria?: string | null;
  fecha_expiracion?: string | null;
};

function validar(body: CuerpoCodigo): string | null {
  if (!body.codigo || !body.codigo.trim()) return "El código es obligatorio";
  if (!body.beneficiario || !body.beneficiario.trim()) return "El beneficiario es obligatorio";
  if (body.tipo_descuento !== "porcentaje" && body.tipo_descuento !== "monto_fijo") {
    return "El tipo de descuento debe ser 'porcentaje' o 'monto_fijo'";
  }
  const valorNum = Number(body.valor);
  if (Number.isNaN(valorNum) || valorNum <= 0) return "El valor debe ser un número mayor a 0";
  if (body.tipo_descuento === "porcentaje" && valorNum > 100) {
    return "Un porcentaje no puede ser mayor a 100";
  }
  return null;
}

export async function GET() {
  const conexion = await db();
  const resultado = await conexion.execute(
    "SELECT * FROM codigos_descuento ORDER BY usado ASC, creado_en DESC"
  );
  return NextResponse.json(resultado.rows);
}

export async function POST(request: Request) {
  let body: CuerpoCodigo;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const error = validar(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const conexion = await db();
  await conexion.execute({
    sql: `INSERT INTO codigos_descuento
            (codigo, beneficiario, descripcion, tipo_descuento, valor, categoria, fecha_expiracion, usado)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    args: [
      body.codigo!.trim(),
      body.beneficiario!.trim(),
      body.descripcion?.trim() || null,
      body.tipo_descuento!,
      Number(body.valor),
      body.categoria?.trim() || null,
      body.fecha_expiracion || null,
    ],
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
