import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateTime, money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "@/components/ui/table";
import { ChartNoAxesCombined,Download,Users,Boxes,WalletCards,ShoppingCart,Truck,Package,ReceiptText,CircleDollarSign } from "lucide-react";

export const dynamic="force-dynamic";
const reportTypes=[
  {key:"sales",label:"Ventas",description:"Ventas, clientes, total y estado.",icon:ShoppingCart},
  {key:"inventory",label:"Inventario",description:"Stock actual, mínimo y valorización.",icon:Boxes},
  {key:"products",label:"Productos",description:"Catálogo, precios y categorías.",icon:Package},
  {key:"customers",label:"Clientes",description:"Clientes y datos de contacto.",icon:Users},
  {key:"debtors",label:"Deudores",description:"Clientes con saldo pendiente.",icon:WalletCards},
  {key:"purchases",label:"Compras",description:"Compras, proveedores y totales.",icon:Truck},
  {key:"expenses",label:"Gastos",description:"Egresos por categoría y usuario.",icon:CircleDollarSign},
  {key:"cash",label:"Caja",description:"Movimientos de caja y medios de pago.",icon:ReceiptText}
] as const;
type ReportType=typeof reportTypes[number]["key"];

export default async function ReportsPage({searchParams}:{searchParams:Promise<{type?:string;from?:string;to?:string}>}){
  await requirePermission("reports.sales");
  const p=await searchParams;const type=(reportTypes.some(x=>x.key===p.type)?p.type:"sales") as ReportType;
  const from=p.from?new Date(`${p.from}T00:00:00`):new Date(new Date().getFullYear(),new Date().getMonth(),1);const to=p.to?new Date(`${p.to}T23:59:59.999`):new Date();
  let headers:string[]=[];let rows:(string|number)[][]=[];let summary:{label:string;value:string}[]=[];
  if(type==="sales"){
    const data=await db.sale.findMany({where:{createdAt:{gte:from,lte:to},status:{not:"CANCELLED"}},include:{customer:true,user:true},orderBy:{createdAt:"desc"},take:500});headers=["Código","Fecha","Cliente","Cajero","Total","Estado"];rows=data.map(s=>[s.code,dateTime(s.createdAt),s.customer.legalName||`${s.customer.firstName??""} ${s.customer.lastName??""}`.trim(),s.user.name,money(s.total.toString()),s.status]);summary=[{label:"Operaciones",value:String(data.length)},{label:"Total vendido",value:money(data.reduce((a,s)=>a+Number(s.total),0))}];
  }else if(type==="inventory"){
    const data=await db.product.findMany({where:{active:true,deletedAt:null},include:{unitOfMeasure:true},orderBy:{name:"asc"},take:1000});headers=["SKU","Producto","Stock","Mínimo","Unidad","Costo promedio","Valor stock"];rows=data.map(x=>[x.sku,x.name,x.stock.toString(),x.minimumStock.toString(),x.unitOfMeasure.symbol,money(x.averageCost.toString()),money(Number(x.averageCost)*Number(x.stock))]);summary=[{label:"Productos",value:String(data.length)},{label:"Stock bajo",value:String(data.filter(x=>x.stock.lessThanOrEqualTo(x.minimumStock)).length)},{label:"Valor inventario",value:money(data.reduce((a,x)=>a+Number(x.averageCost)*Number(x.stock),0))}];
  }else if(type==="products"){
    const data=await db.product.findMany({where:{active:true,deletedAt:null},include:{category:true,brand:true,unitOfMeasure:true},orderBy:{name:"asc"},take:1000});headers=["SKU","Producto","Categoría","Marca","Unidad","Precio venta","Stock"];rows=data.map(x=>[x.sku,x.name,x.category?.name??"—",x.brand?.name??"—",x.unitOfMeasure.symbol,money(x.salePrice.toString()),x.stock.toString()]);summary=[{label:"Productos activos",value:String(data.length)}];
  }else if(type==="customers"||type==="debtors"){
    const data=await db.customer.findMany({where:{general:false,active:true},include:{credit:true},orderBy:{updatedAt:"desc"},take:1000});const filtered=type==="debtors"?data.filter(x=>Number(x.credit?.balance??0)>0):data;headers=["Cliente","DNI","RUC","Teléfono","Correo","Deuda","Límite crédito"];rows=filtered.map(x=>[x.legalName||`${x.firstName??""} ${x.lastName??""}`.trim(),x.dni??"—",x.ruc??"—",x.phone??"—",x.email??"—",money(Number(x.credit?.balance??0)),money(Number(x.creditLimit))]);summary=[{label:type==="debtors"?"Deudores":"Clientes",value:String(filtered.length)},{label:"Deuda total",value:money(filtered.reduce((a,x)=>a+Number(x.credit?.balance??0),0))}];
  }else if(type==="purchases"){
    const data=await db.purchase.findMany({where:{purchasedAt:{gte:from,lte:to}},include:{supplier:true,user:true},orderBy:{purchasedAt:"desc"},take:500});headers=["Código","Fecha","Proveedor","Usuario","Total","Estado"];rows=data.map(x=>[x.code,dateTime(x.purchasedAt),x.supplier.tradeName||x.supplier.legalName,x.user.name,money(x.total.toString()),x.status]);summary=[{label:"Compras",value:String(data.length)},{label:"Total comprado",value:money(data.reduce((a,x)=>a+Number(x.total),0))}];
  }else if(type==="expenses"){
    const data=await db.expense.findMany({where:{createdAt:{gte:from,lte:to},status:"ACTIVE"},include:{category:true,user:true},orderBy:{createdAt:"desc"},take:500});headers=["Fecha","Categoría","Descripción","Método","Monto","Usuario"];rows=data.map(x=>[dateTime(x.createdAt),x.category.name,x.description,x.paymentMethod,money(x.amount.toString()),x.user.name]);summary=[{label:"Gastos",value:String(data.length)},{label:"Total gastos",value:money(data.reduce((a,x)=>a+Number(x.amount),0))}];
  }else{
    const data=await db.cashMovement.findMany({where:{createdAt:{gte:from,lte:to}},include:{user:true},orderBy:{createdAt:"desc"},take:500});headers=["Fecha","Tipo","Método","Descripción","Monto","Usuario"];rows=data.map(x=>[dateTime(x.createdAt),x.type,x.paymentMethod??"—",x.description??"—",money(x.amount.toString()),x.user.name]);summary=[{label:"Movimientos",value:String(data.length)},{label:"Monto acumulado",value:money(data.reduce((a,x)=>a+Number(x.amount),0))}];
  }
  const qs=new URLSearchParams({type,from:from.toISOString().slice(0,10),to:to.toISOString().slice(0,10)});
  return <div className="w-full space-y-6">
    <div className="space-y-1"><div className="flex items-center gap-2"><ChartNoAxesCombined className="size-5 text-muted-foreground"/><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Reportes</h1></div><p className="text-sm text-muted-foreground">Selecciona el aspecto que deseas analizar y exporta los resultados.</p></div>
    <div className="w-full overflow-x-auto pb-2"><div className="flex min-w-max gap-3">{reportTypes.map(({key,label,description,icon:Icon})=><Link key={key} href={`/reports?${new URLSearchParams({type:key,from:qs.get("from")!,to:qs.get("to")!})}`} className={`w-52 rounded-2xl p-4 shadow-sm transition ${type===key?"bg-primary text-primary-foreground":"bg-card hover:bg-muted/50"}`}><Icon className="size-5"/><p className="mt-3 text-sm font-semibold">{label}</p><p className={`mt-1 text-xs leading-5 ${type===key?"text-primary-foreground/75":"text-muted-foreground"}`}>{description}</p></Link>)}</div></div>
    <Card className="border-0 shadow-sm"><CardContent className="p-4"><form className="grid gap-3 sm:grid-cols-[180px_180px_auto] sm:items-end"><input type="hidden" name="type" value={type}/><label className="space-y-1 text-sm"><span className="text-muted-foreground">Desde</span><input type="date" name="from" defaultValue={qs.get("from")!} className="h-10 w-full rounded-xl bg-muted/40 px-3 shadow-sm"/></label><label className="space-y-1 text-sm"><span className="text-muted-foreground">Hasta</span><input type="date" name="to" defaultValue={qs.get("to")!} className="h-10 w-full rounded-xl bg-muted/40 px-3 shadow-sm"/></label><Button type="submit">Aplicar filtros</Button></form></CardContent></Card>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{summary.map(s=><Card key={s.label} className="border-0 shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">{s.label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p></CardContent></Card>)}</section>
    <Card className="border-0 shadow-sm"><CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-base">Reporte de {reportTypes.find(x=>x.key===type)?.label}</CardTitle><CardDescription>Hasta 1000 registros visibles según el tipo seleccionado.</CardDescription></div><div className="flex flex-wrap gap-2"><Button asChild variant="secondary" size="sm"><a href={`/api/reports/export?${qs}&format=xlsx`}><Download className="size-4"/>Excel</a></Button><Button asChild variant="secondary" size="sm"><a href={`/api/reports/export?${qs}&format=csv`}><Download className="size-4"/>CSV</a></Button></div></CardHeader><CardContent className="p-0"><div className="w-full overflow-x-auto"><Table className="min-w-max"><TableHeader><TableRow>{headers.map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.length?rows.map((row,i)=><TableRow key={i}>{row.map((value,j)=><TableCell key={j} className="whitespace-nowrap">{value}</TableCell>)}</TableRow>):<TableRow><TableCell colSpan={headers.length}><div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">No hay datos para este reporte.</div></TableCell></TableRow>}</TableBody></Table></div></CardContent></Card>
  </div>;
}
