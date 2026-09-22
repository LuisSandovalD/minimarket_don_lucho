import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { env } from "@/lib/env";
import { importConfig, importTypes, suggestMapping, type ImportEntity } from "@/modules/imports/config";

export async function POST(request: Request) {
  await requirePermission("imports.execute");
  const form = await request.formData();
  const file = form.get("file");
  const type = String(form.get("type") ?? "products") as ImportEntity;
  if (!importTypes.includes(type)) return NextResponse.json({ success: false, message: "Tipo de importación inválido." }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ success: false, message: "Selecciona un archivo." }, { status: 400 });
  if (file.size > env().MAX_UPLOAD_MB * 1024 * 1024) return NextResponse.json({ success: false, message: "El archivo supera el límite permitido." }, { status: 413 });
  if (!/\.(xlsx|csv)$/i.test(file.name)) return NextResponse.json({ success: false, message: "Solo se admite XLSX o CSV." }, { status: 400 });
  const wb = new ExcelJS.Workbook();
  const data = Buffer.from(await file.arrayBuffer());
  if (file.name.toLowerCase().endsWith(".csv")) await wb.csv.read(data as never); else await wb.xlsx.load(data as never);
  const sheet = wb.worksheets[0];
  if (!sheet) return NextResponse.json({ success: false, message: "El archivo no contiene hojas." }, { status: 400 });
  if (sheet.rowCount > 5001) return NextResponse.json({ success: false, message: "Máximo 5000 filas por importación." }, { status: 400 });
  const headers = (sheet.getRow(1).values as unknown[]).slice(1).map(String);
  const rows: Record<string, string>[] = [];
  for (let n = 2; n <= Math.min(sheet.rowCount, 52); n++) {
    const values = (sheet.getRow(n).values as unknown[]).slice(1);
    if (values.every(v => v == null || String(v).trim() === "")) continue;
    rows.push(Object.fromEntries(headers.map((header, index) => [header, String(values[index] ?? "")])));
  }
  return NextResponse.json({ success: true, data: { type, fileName: file.name, totalRows: Math.max(0, sheet.rowCount - 1), headers, mapping: suggestMapping(headers, type), rows, required: importConfig[type].required, fields: importConfig[type].fields } });
}
