import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { importConfig, importTypes, type ImportEntity } from "@/modules/imports/config";

export async function GET(request:Request){
  await requirePermission("imports.view");
  const type=String(new URL(request.url).searchParams.get("type")??"products") as ImportEntity;
  if(!importTypes.includes(type))return NextResponse.json({success:false,message:"Tipo inválido."},{status:400});
  const config=importConfig[type],wb=new ExcelJS.Workbook(),sheet=wb.addWorksheet(config.label.toUpperCase());
  sheet.columns=config.fields.map(f=>({header:f.label,key:f.key,width:22}));
  const examples:Record<ImportEntity,Record<string,unknown>>={
    products:{sku:"DL-000001",barcode:"00123456789",name:"Producto ejemplo",category:"Abarrotes",brand:"Marca",unit:"und",purchasePrice:2.5,salePrice:3.5,stock:20,minimumStock:5},
    customers:{firstName:"Luis",lastName:"Pérez",dni:"12345678",phone:"999999999",email:"cliente@correo.com",address:"Cañete",creditLimit:100},
    suppliers:{legalName:"Proveedor Ejemplo SAC",tradeName:"Proveedor Ejemplo",ruc:"20123456789",contactName:"Juan Pérez",phone:"999999999",email:"ventas@proveedor.com"},
    inventory:{sku:"DL-000001",stock:35,reason:"Conteo físico"},
    sales:{saleRef:"V-EXT-001",customer:"12345678",sku:"DL-000001",quantity:2,unitPrice:3.5,paymentMethod:"CASH"}
  };
  sheet.addRow(examples[type]);sheet.getRow(1).font={bold:true,color:{argb:"FFFFFFFF"}};sheet.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF166534"}};
  const instructions=wb.addWorksheet("INSTRUCCIONES");instructions.columns=[{header:"Tema",key:"topic",width:28},{header:"Detalle",key:"detail",width:100}];instructions.addRows([
    {topic:"Tipo",detail:config.label},{topic:"Descripción",detail:config.description},{topic:"Campos obligatorios",detail:config.required.length?config.required.join(", "):"No hay campos técnicos obligatorios; clientes requiere nombres o razón social."},{topic:"Filas",detail:"Máximo 5000 filas por archivo."},{topic:"Ventas",detail:type==="sales"?"Varias filas con la misma Referencia venta se agrupan en una sola venta. Requiere caja abierta y productos/clientes existentes.":"—"},{topic:"Decimales",detail:"Se admite 3.5, 3,50 o S/ 3.50."}
  ]);
  const buffer=await wb.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer),{headers:{"content-type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","content-disposition":`attachment; filename=plantilla_${type}_don_lucho.xlsx`}});
}
