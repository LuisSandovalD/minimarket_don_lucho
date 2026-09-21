import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
export async function GET(request:Request){await requirePermission("products.view");const q=new URL(request.url).searchParams.get("q")?.trim()??"";if(!q)return NextResponse.json({data:[]});const products=await db.product.findMany({where:{active:true,deletedAt:null,OR:[{sku:{equals:q,mode:"insensitive"}},{barcodes:{some:{code:q}}},{name:{contains:q,mode:"insensitive"}}]},include:{unitOfMeasure:true},take:20,orderBy:{name:"asc"}});return NextResponse.json({data:products.map(p=>({id:p.id,sku:p.sku,name:p.name,price:p.salePrice.toString(),stock:p.stock.toString(),allowsDecimals:p.allowsDecimals,unit:p.unitOfMeasure.symbol}))});}
