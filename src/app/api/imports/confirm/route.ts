import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { nextSequence } from "@/lib/sequence";
import { createSale } from "@/modules/sales/service";
import { importConfig, importTypes, normalizeHeader, parseDecimal, type ImportEntity } from "@/modules/imports/config";

const paymentMethods = new Set(["CASH","YAPE","PLIN","CARD","TRANSFER","CREDIT","OTHER"]);
const paymentAlias: Record<string,string> = { efectivo:"CASH", cash:"CASH", yape:"YAPE", plin:"PLIN", tarjeta:"CARD", card:"CARD", transferencia:"TRANSFER", transfer:"TRANSFER", credito:"CREDIT", crédito:"CREDIT", fiado:"CREDIT", otro:"OTHER" };

export async function POST(request: Request) {
  const user = await requirePermission("imports.execute");
  const form = await request.formData();
  const file = form.get("file");
  const strategy = String(form.get("strategy") ?? "SKIP");
  const type = String(form.get("type") ?? "products") as ImportEntity;
  if (!importTypes.includes(type) || !(file instanceof File) || !["SKIP","UPDATE"].includes(strategy)) return NextResponse.json({ success:false, message:"Solicitud inválida." }, { status:400 });
  if (file.size > env().MAX_UPLOAD_MB * 1024 * 1024) return NextResponse.json({ success:false, message:"Archivo demasiado grande." }, { status:413 });
  let mapping: Record<string,string|null>;
  try { mapping = JSON.parse(String(form.get("mapping"))); } catch { return NextResponse.json({ success:false, message:"Mapeo inválido." }, { status:400 }); }
  const mapped = Object.values(mapping).filter(Boolean) as string[];
  const missing = importConfig[type].required.filter(f => !mapped.includes(f));
  if (missing.length) return NextResponse.json({ success:false, message:`Faltan columnas obligatorias: ${missing.join(", ")}.` }, { status:400 });

  const wb = new ExcelJS.Workbook();
  const buffer = Buffer.from(await file.arrayBuffer());
  if (file.name.toLowerCase().endsWith(".csv")) await wb.csv.read(buffer as never); else await wb.xlsx.load(buffer as never);
  const sheet = wb.worksheets[0];
  if (!sheet || sheet.rowCount > 5001) return NextResponse.json({ success:false, message:"Archivo vacío o superior a 5000 filas." }, { status:400 });
  const headers = (sheet.getRow(1).values as unknown[]).slice(1).map(String);
  const job = await db.$transaction(async tx => tx.importJob.create({ data:{ code:await nextSequence(tx,"import","IMP"), userId:user.id, fileName:file.name, type:strategy === "UPDATE" ? "UPDATE" : "CREATE", status:"PROCESSING", totalRows:Math.max(0,sheet.rowCount-1), mapping:{ entity:type, columns:mapping } as Prisma.InputJsonValue } }));
  let created=0, updated=0, skipped=0, errors=0;
  const addError = async (rowNumber:number, error:unknown) => { errors++; await db.importError.create({ data:{ importJobId:job.id, rowNumber, message:error instanceof Error ? error.message : "Error de validación" } }); };
  const rows: { n:number; data:Record<string,unknown> }[] = [];
  for (let n=2;n<=sheet.rowCount;n++) { const values=(sheet.getRow(n).values as unknown[]).slice(1); if(values.every(v=>v==null||String(v).trim()==="")) continue; const row:Record<string,unknown>={}; headers.forEach((h,i)=>{const field=mapping[h];if(field)row[field]=values[i]}); rows.push({n,data:row}); }

  if (type === "sales") {
    const groups = new Map<string, typeof rows>();
    rows.forEach(r => { const key=String(r.data.saleRef??`ROW-${r.n}`).trim()||`ROW-${r.n}`; groups.set(key,[...(groups.get(key)??[]),r]); });
    for (const [, lines] of groups) {
      try {
        const first=lines[0].data; const customerKey=String(first.customer??"").trim(); if(!customerKey) throw new Error("Cliente obligatorio");
        const customer=await db.customer.findFirst({where:{active:true,OR:[{dni:customerKey},{ruc:customerKey}]}}); if(!customer) throw new Error(`Cliente no encontrado: ${customerKey}`);
        const items=[] as {productId:string;quantity:string;unitPrice:string;discount:number}[]; let total=new Prisma.Decimal(0);
        for(const line of lines){const sku=String(line.data.sku??"").trim();const quantity=parseDecimal(line.data.quantity);const unitPrice=parseDecimal(line.data.unitPrice);if(!sku||!quantity||Number(quantity)<=0||!unitPrice||Number(unitPrice)<0)throw new Error(`Producto/cantidad/precio inválido en fila ${line.n}`);const product=await db.product.findFirst({where:{active:true,deletedAt:null,OR:[{sku},{barcodes:{some:{code:sku}}}]}});if(!product)throw new Error(`Producto no encontrado: ${sku}`);items.push({productId:product.id,quantity,unitPrice,discount:0});total=total.plus(new Prisma.Decimal(quantity).mul(unitPrice));}
        const rawMethod=normalizeHeader(first.paymentMethod);const method=(paymentAlias[rawMethod]??String(first.paymentMethod??"").trim().toUpperCase());if(!paymentMethods.has(method))throw new Error(`Método de pago inválido: ${first.paymentMethod}`);
        await createSale({idempotencyKey:`import-${job.id}-${lines[0].n}`,customerId:customer.id,discount:0,items,payments:[{method,amount:total.toDecimalPlaces(2).toString(),receivedAmount:method==="CASH"?total.toDecimalPlaces(2).toString():undefined}]},user.id);created++;
      } catch(error){await addError(lines[0].n,error)}
    }
  } else {
    const settings = type === "products" ? await db.businessSettings.upsert({where:{id:"singleton"},create:{},update:{}}) : null;
    for (const {n,data:row} of rows) {
      try {
        if(type==="customers"){
          const firstName=String(row.firstName??"").trim()||null,lastName=String(row.lastName??"").trim()||null,legalName=String(row.legalName??"").trim()||null,dni=String(row.dni??"").trim()||null,ruc=String(row.ruc??"").trim()||null;
          if(!firstName&&!legalName)throw new Error("Nombres o razón social obligatorios"); if(dni&&!/^\d{8}$/.test(dni))throw new Error("DNI inválido"); if(ruc&&!/^\d{11}$/.test(ruc))throw new Error("RUC inválido");
          const existing=await db.customer.findFirst({where:{OR:[...(dni?[{dni}]:[]),...(ruc?[{ruc}]:[])]}}); if(existing&&strategy==="SKIP"){skipped++;continue}
          const data={firstName,lastName,legalName,dni,ruc,phone:String(row.phone??"").trim()||null,email:String(row.email??"").trim().toLowerCase()||null,address:String(row.address??"").trim()||null,creditLimit:parseDecimal(row.creditLimit)??"0",active:true};
          if(existing){await db.customer.update({where:{id:existing.id},data});updated++}else{await db.customer.create({data});created++}
        } else if(type==="suppliers"){
          const legalName=String(row.legalName??"").trim(),ruc=String(row.ruc??"").trim()||null;if(!legalName)throw new Error("Razón social obligatoria");if(ruc&&!/^\d{11}$/.test(ruc))throw new Error("RUC inválido");const existing=ruc?await db.supplier.findUnique({where:{ruc}}):null;if(existing&&strategy==="SKIP"){skipped++;continue}const data={legalName,tradeName:String(row.tradeName??"").trim()||null,ruc,contactName:String(row.contactName??"").trim()||null,phone:String(row.phone??"").trim()||null,email:String(row.email??"").trim().toLowerCase()||null,address:String(row.address??"").trim()||null,active:true};if(existing){await db.supplier.update({where:{id:existing.id},data});updated++}else{await db.supplier.create({data});created++}
        } else if(type==="inventory"){
          const sku=String(row.sku??"").trim(),stock=parseDecimal(row.stock);if(!sku||stock==null||Number(stock)<0)throw new Error("SKU y stock objetivo válido son obligatorios");const product=await db.product.findFirst({where:{OR:[{sku},{barcodes:{some:{code:sku}}}],deletedAt:null}});if(!product)throw new Error(`Producto no encontrado: ${sku}`);const target=new Prisma.Decimal(stock),delta=target.minus(product.stock);if(delta.isZero()){skipped++;continue}await db.$transaction(async tx=>{await tx.product.update({where:{id:product.id},data:{stock:target}});await tx.inventoryMovement.create({data:{productId:product.id,previousStock:product.stock,quantity:delta,resultingStock:target,unitCost:product.averageCost,type:"IMPORT",referenceType:"IMPORT_JOB",referenceId:job.id,userId:user.id}})});updated++;
        } else {
          const name=String(row.name??"").trim(),unitValue=String(row.unit??"").trim(),salePrice=parseDecimal(row.salePrice),purchasePrice=parseDecimal(row.purchasePrice)??"0",stock=parseDecimal(row.stock)??"0",minimumStock=parseDecimal(row.minimumStock)??"0",sku=String(row.sku??"").trim(),barcode=String(row.barcode??"").trim();if(!name)throw new Error("Nombre obligatorio");if(!salePrice||Number(salePrice)<0)throw new Error("Precio de venta inválido");const unit=await db.unitOfMeasure.findFirst({where:{active:true,OR:[{symbol:{equals:unitValue,mode:"insensitive"}},{name:{equals:unitValue,mode:"insensitive"}}]}});if(!unit)throw new Error(`Unidad inexistente: ${unitValue}`);const existing=await db.product.findFirst({where:{OR:[...(sku?[{sku}]:[]),...(barcode?[{barcodes:{some:{code:barcode}}}]:[])]}});if(existing&&strategy==="SKIP"){skipped++;continue}let categoryId:string|undefined,brandId:string|undefined;if(row.category){const categoryName=String(row.category).trim();const slug=normalizeHeader(categoryName).replace(/\s+/g,"-");categoryId=(await db.productCategory.upsert({where:{slug},create:{name:categoryName,slug},update:{active:true}})).id}if(row.brand){const brandName=String(row.brand).trim();brandId=(await db.brand.upsert({where:{name:brandName},create:{name:brandName},update:{active:true}})).id}if(existing){await db.product.update({where:{id:existing.id},data:{name,salePrice,purchasePrice,lastCost:purchasePrice,unitOfMeasureId:unit.id,allowsDecimals:unit.allowsDecimals,categoryId,brandId}});updated++}else{const generatedSku=sku||await db.$transaction(tx=>nextSequence(tx,"sku",settings?.skuPrefix??"DL"));const product=await db.product.create({data:{sku:generatedSku,qrCode:generatedSku,name,unitOfMeasureId:unit.id,saleType:unit.type,purchasePrice,lastCost:purchasePrice,averageCost:purchasePrice,salePrice,stock,minimumStock,allowsDecimals:unit.allowsDecimals,categoryId,brandId,barcodes:barcode?{create:{code:barcode,type:"CUSTOM",primary:true}}:undefined}});if(Number(stock)!==0)await db.inventoryMovement.create({data:{productId:product.id,previousStock:0,quantity:stock,resultingStock:stock,unitCost:purchasePrice,type:"IMPORT",referenceType:"IMPORT_JOB",referenceId:job.id,userId:user.id}});created++}
        }
      } catch(error){await addError(n,error)}
    }
  }
  await db.importJob.update({where:{id:job.id},data:{status:errors?"COMPLETED_WITH_ERRORS":"COMPLETED",processedRows:created+updated+skipped+errors,createdRows:created,updatedRows:updated,skippedRows:skipped,errorRows:errors,completedAt:new Date()}});
  return NextResponse.json({success:true,data:{jobId:job.id,created,updated,skipped,errors}});
}
