import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { z } from "zod";
const db = new PrismaClient();
const permissionKeys = [
<<<<<<< HEAD
  "inventory.sell_negative", "credits.exceed_limit",
=======
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
  "dashboard.view","products.view","products.create","products.update","products.disable","products.change_price","products.view_cost","products.import","products.export",
  "inventory.view","inventory.adjust","inventory.register_loss","inventory.view_kardex","sales.view","sales.create","sales.cancel","sales.refund","sales.discount","sales.change_price",
  "customers.view","customers.create","customers.update","credits.view","credits.create","credits.receive_payment","credits.adjust","purchases.view","purchases.create","purchases.cancel",
  "suppliers.view","suppliers.create","suppliers.update","cash.view","cash.open","cash.close","cash.withdraw","cash.adjust","expenses.view","expenses.create","expenses.cancel",
  "reports.sales","reports.inventory","reports.profit","reports.cash","reports.credits","users.view","users.create","users.update","users.disable","roles.view","roles.manage",
  "imports.view","imports.execute","audit.view","settings.view","settings.update"
] as const;
const roleGrants: Record<string, string[]> = {
  ADMINISTRADOR: [...permissionKeys],
  CAJERO: ["dashboard.view","products.view","sales.view","sales.create","customers.view","customers.create","credits.view","credits.create","credits.receive_payment","cash.view","cash.open","cash.close"],
  "ALMACÉN": ["dashboard.view","products.view","products.create","products.update","products.import","products.export","inventory.view","inventory.adjust","inventory.register_loss","inventory.view_kardex","purchases.view","purchases.create","suppliers.view","suppliers.create","suppliers.update","imports.view","imports.execute"],
  SUPERVISOR: ["dashboard.view","products.view","products.change_price","products.view_cost","inventory.view","inventory.adjust","inventory.view_kardex","sales.view","sales.cancel","sales.refund","sales.discount","customers.view","credits.view","cash.view","cash.close","cash.withdraw","reports.sales","reports.inventory","reports.cash","audit.view"]
};
async function main() {
  const env = z.object({ ADMIN_NAME: z.string().min(2), ADMIN_EMAIL: z.email(), ADMIN_PASSWORD: z.string().min(12) }).parse(process.env);
  for (const key of permissionKeys) await db.permission.upsert({ where: { key }, create: { key, module: key.split(".")[0] }, update: { module: key.split(".")[0] } });
  for (const [name, grants] of Object.entries(roleGrants)) { const role = await db.role.upsert({ where: { name }, create: { name, system: true }, update: { system: true, active: true } }); const permissions = await db.permission.findMany({ where: { key: { in: grants } } }); await db.rolePermission.deleteMany({ where: { roleId: role.id } }); await db.rolePermission.createMany({ data: permissions.map(permission => ({ roleId: role.id, permissionId: permission.id })), skipDuplicates: true }); }
  const adminRole = await db.role.findUniqueOrThrow({ where: { name: "ADMINISTRADOR" } }); const passwordHash = await argon2.hash(env.ADMIN_PASSWORD, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const admin = await db.user.upsert({ where: { email: env.ADMIN_EMAIL.toLowerCase() }, create: { name: env.ADMIN_NAME, email: env.ADMIN_EMAIL.toLowerCase(), passwordHash, active: true, emailVerifiedAt: new Date() }, update: { name: env.ADMIN_NAME, active: true } });
  await db.userRole.upsert({ where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } }, create: { userId: admin.id, roleId: adminRole.id }, update: {} });
  const units = [{ name: "Unidad", symbol: "und", type: "QUANTITY", allowsDecimals: false },{ name: "Caja", symbol: "caja", type: "QUANTITY", allowsDecimals: false },{ name: "Paquete", symbol: "pq", type: "QUANTITY", allowsDecimals: false },{ name: "Pack", symbol: "pack", type: "QUANTITY", allowsDecimals: false },{ name: "Bolsa", symbol: "bolsa", type: "QUANTITY", allowsDecimals: false },{ name: "Docena", symbol: "doc", type: "QUANTITY", allowsDecimals: false },{ name: "Kilogramo", symbol: "kg", type: "WEIGHT", allowsDecimals: true },{ name: "Gramo", symbol: "g", type: "WEIGHT", allowsDecimals: true },{ name: "Litro", symbol: "L", type: "VOLUME", allowsDecimals: true },{ name: "Mililitro", symbol: "ml", type: "VOLUME", allowsDecimals: true }] as const;
  for (const unit of units) await db.unitOfMeasure.upsert({ where: { symbol: unit.symbol }, create: unit, update: unit });
  for (const name of ["Abarrotes","Bebidas","Lácteos","Limpieza","Higiene personal","Snacks"]) { const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g,"-"); await db.productCategory.upsert({ where: { slug }, create: { name, slug }, update: { name, active: true } }); }
  for (const name of ["Servicios","Movilidad","Limpieza","Mantenimiento","Alimentación","Bolsas","Compras menores","Otros"]) await db.expenseCategory.upsert({ where: { name }, create: { name }, update: { active: true } });
  await db.businessSettings.upsert({ where: { id: "singleton" }, create: {}, update: {} }); await db.cashRegister.upsert({ where: { name: "Caja principal" }, create: { name: "Caja principal" }, update: { active: true } });
  const general = await db.customer.findFirst({ where: { general: true } }); if (!general) await db.customer.create({ data: { legalName: "CLIENTE GENERAL", general: true, creditLimit: 0 } });
}
main().finally(() => db.$disconnect());
