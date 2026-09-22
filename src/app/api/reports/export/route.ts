import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request:Request){
  await requirePermission("reports.sales");
  const params=new URL(request.url).searchParams;const format=params.get("format")??"xlsx",type=params.get("type")??"sales";const from=params.get("from")?new Date(`${params.get("from")}T00:00:00`):new Date(new Date().getFullYear(),new Date().getMonth(),1);const to=params.get("to")?new Date(`${params.get("to")}T23:59:59.999`):new Date();
  let headers:string[]=[];let rows:(string|number)[][]=[];
  if(type==="sales"){const data=await db.sale.findMany({where:{createdAt:{gte:from,lte:to},status:{not:"CANCELLED"}},include:{customer:true,user:true},orderBy:{createdAt:"asc"},take:10000});headers=["Código","Fecha","Cliente","Cajero","Total","Estado"];rows=data.map(s=>[s.code,s.createdAt.toISOString(),s.customer.legalName||`${s.customer.firstName??""} ${s.customer.lastName??""}`.trim(),s.user.name,s.total.toString(),s.status])}
  else if(type==="inventory"){const data=await db.product.findMany({where:{active:true,deletedAt:null},include:{unitOfMeasure:true},orderBy:{name:"asc"},take:10000});headers=["SKU","Producto","Stock","Mínimo","Unidad","Costo promedio","Valor stock"];rows=data.map(x=>[x.sku,x.name,x.stock.toString(),x.minimumStock.toString(),x.unitOfMeasure.symbol,x.averageCost.toString(),(Number(x.averageCost)*Number(x.stock)).toFixed(2)])}
  else if(type==="products"){const data=await db.product.findMany({where:{active:true,deletedAt:null},include:{category:true,brand:true,unitOfMeasure:true},orderBy:{name:"asc"},take:10000});headers=["SKU","Producto","Categoría","Marca","Unidad","Precio venta","Stock"];rows=data.map(x=>[x.sku,x.name,x.category?.name??"",x.brand?.name??"",x.unitOfMeasure.symbol,x.salePrice.toString(),x.stock.toString()])}
  else if(type==="customers"||type==="debtors"){const data=await db.customer.findMany({where:{general:false,active:true},include:{credit:true},orderBy:{updatedAt:"desc"},take:10000});const list=type==="debtors"?data.filter(x=>Number(x.credit?.balance??0)>0):data;headers=["Cliente","DNI","RUC","Teléfono","Correo","Deuda","Límite crédito"];rows=list.map(x=>[x.legalName||`${x.firstName??""} ${x.lastName??""}`.trim(),x.dni??"",x.ruc??"",x.phone??"",x.email??"",String(x.credit?.balance??0),x.creditLimit.toString()])}
  else if(type==="purchases"){const data=await db.purchase.findMany({where:{purchasedAt:{gte:from,lte:to}},include:{supplier:true,user:true},orderBy:{purchasedAt:"asc"},take:10000});headers=["Código","Fecha","Proveedor","Usuario","Total","Estado"];rows=data.map(x=>[x.code,x.purchasedAt.toISOString(),x.supplier.tradeName||x.supplier.legalName,x.user.name,x.total.toString(),x.status])}
  else if(type==="expenses"){const data=await db.expense.findMany({where:{createdAt:{gte:from,lte:to},status:"ACTIVE"},include:{category:true,user:true},orderBy:{createdAt:"asc"},take:10000});headers=["Fecha","Categoría","Descripción","Método","Monto","Usuario"];rows=data.map(x=>[x.createdAt.toISOString(),x.category.name,x.description,x.paymentMethod,x.amount.toString(),x.user.name])}
  else if(type==="cash"){const data=await db.cashMovement.findMany({where:{createdAt:{gte:from,lte:to}},include:{user:true},orderBy:{createdAt:"asc"},take:10000});headers=["Fecha","Tipo","Método","Descripción","Monto","Usuario"];rows=data.map(x=>[x.createdAt.toISOString(),x.type,x.paymentMethod??"",x.description??"",x.amount.toString(),x.user.name])}
  else return NextResponse.json({success:false,message:"Tipo de reporte inválido."},{status:400});

  if(format==="xlsx"||format==="csv"){
    const wb=new ExcelJS.Workbook(),sheet=wb.addWorksheet(type.toUpperCase());sheet.columns=headers.map((header,index)=>({header,key:String(index),width:24}));rows.forEach(row=>sheet.addRow(Object.fromEntries(row.map((value,index)=>[String(index),value]))));sheet.getRow(1).font={bold:true,color:{argb:"FFFFFFFF"}};sheet.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF166534"}};const data=format==="csv"?await wb.csv.writeBuffer():await wb.xlsx.writeBuffer();return new NextResponse(Buffer.from(data),{headers:{"content-type":format==="csv"?"text/csv":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","content-disposition":`attachment; filename=reporte-${type}.${format}`}})
  }
  if(format==="pdf"){
    const pdf=await PDFDocument.create(),page=pdf.addPage([842,595]),font=await pdf.embedFont(StandardFonts.Helvetica);page.drawText(`Reporte ${type} - Minimarket Don Lucho`,{x:32,y:560,size:14,font});let y=535;page.drawText(headers.join(" | ").slice(0,135),{x:32,y,size:7,font});y-=14;for(const row of rows.slice(0,35)){page.drawText(row.join(" | ").slice(0,145),{x:32,y,size:7,font});y-=14}const data=await pdf.save();return new NextResponse(Buffer.from(data),{headers:{"content-type":"application/pdf","content-disposition":`attachment; filename=reporte-${type}.pdf`}})
  }
  return NextResponse.json({success:false,message:"Formato inválido."},{status:400});
}
