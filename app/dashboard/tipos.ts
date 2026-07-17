export type Codigo = {
  id: number;
  codigo: string;
  beneficiario: string;
  descripcion: string | null;
  tipo_descuento: "porcentaje" | "monto_fijo";
  valor: number;
  categoria: string | null;
  fecha_expiracion: string | null;
  usado: number;
  creado_en: string;
};
