import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { z } from "zod";

const db = new PrismaClient();

const permissionKeys = ["inventory.sell_negative", "credits.exceed_limit", "dashboard.view", "products.view", "products.create", "products.update", "products.disable", "products.change_price", "products.view_cost", "products.import", "products.export", "inventory.view", "inventory.adjust", "inventory.register_loss", "inventory.view_kardex", "sales.view", "sales.create", "sales.cancel", "sales.refund", "sales.discount", "sales.change_price", "customers.view", "customers.create", "customers.update", "credits.view", "credits.create", "credits.receive_payment", "credits.adjust", "purchases.view", "purchases.create", "purchases.cancel", "suppliers.view", "suppliers.create", "suppliers.update", "cash.view", "cash.open", "cash.close", "cash.withdraw", "cash.adjust", "expenses.view", "expenses.create", "expenses.cancel", "reports.sales", "reports.inventory", "reports.profit", "reports.cash", "reports.credits", "users.view", "users.create", "users.update", "users.disable", "roles.view", "roles.manage", "imports.view", "imports.execute", "audit.view", "settings.view", "settings.update"] as const;

const roleGrants: Record<string, string[]> = {
  ADMINISTRADOR: [...permissionKeys],
  CAJERO: ["dashboard.view", "products.view", "sales.view", "sales.create", "customers.view", "customers.create", "credits.view", "credits.create", "credits.receive_payment", "cash.view", "cash.open", "cash.close"],
  "ALMACÉN": ["dashboard.view", "products.view", "products.create", "products.update", "products.import", "products.export", "inventory.view", "inventory.adjust", "inventory.register_loss", "inventory.view_kardex", "purchases.view", "purchases.create", "suppliers.view", "suppliers.create", "suppliers.update", "imports.view", "imports.execute"],
  SUPERVISOR: ["dashboard.view", "products.view", "products.change_price", "products.view_cost", "inventory.view", "inventory.adjust", "inventory.view_kardex", "sales.view", "sales.cancel", "sales.refund", "sales.discount", "customers.view", "credits.view", "cash.view", "cash.close", "cash.withdraw", "reports.sales", "reports.inventory", "reports.cash", "audit.view"]
};

const toSlug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const env = z.object({ ADMIN_NAME: z.string().min(2), ADMIN_EMAIL: z.email(), ADMIN_PASSWORD: z.string().min(12) }).parse(process.env);

  for (const key of permissionKeys) await db.permission.upsert({ where: { key }, create: { key, module: key.split(".")[0] }, update: { module: key.split(".")[0] } });

  for (const [name, grants] of Object.entries(roleGrants)) {
    const role = await db.role.upsert({ where: { name }, create: { name, system: true }, update: { system: true, active: true } });
    const permissions = await db.permission.findMany({ where: { key: { in: grants } } });
    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    await db.rolePermission.createMany({ data: permissions.map(permission => ({ roleId: role.id, permissionId: permission.id })), skipDuplicates: true });
  }

  const adminRole = await db.role.findUniqueOrThrow({ where: { name: "ADMINISTRADOR" } });
  const passwordHash = await argon2.hash(env.ADMIN_PASSWORD, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const admin = await db.user.upsert({ where: { email: env.ADMIN_EMAIL.toLowerCase() }, create: { name: env.ADMIN_NAME, email: env.ADMIN_EMAIL.toLowerCase(), passwordHash, active: true, emailVerifiedAt: new Date() }, update: { name: env.ADMIN_NAME, active: true } });
  await db.userRole.upsert({ where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } }, create: { userId: admin.id, roleId: adminRole.id }, update: {} });

  const units = [
    { name: "Unidad", symbol: "und", type: "QUANTITY", allowsDecimals: false },
    { name: "Caja", symbol: "caja", type: "QUANTITY", allowsDecimals: false },
    { name: "Paquete", symbol: "pq", type: "QUANTITY", allowsDecimals: false },
    { name: "Pack", symbol: "pack", type: "QUANTITY", allowsDecimals: false },
    { name: "Bolsa", symbol: "bolsa", type: "QUANTITY", allowsDecimals: false },
    { name: "Docena", symbol: "doc", type: "QUANTITY", allowsDecimals: false },
    { name: "Botella", symbol: "bot", type: "QUANTITY", allowsDecimals: false },
    { name: "Lata", symbol: "lata", type: "QUANTITY", allowsDecimals: false },
    { name: "Pote", symbol: "pote", type: "QUANTITY", allowsDecimals: false },
    { name: "Rollo", symbol: "rollo", type: "QUANTITY", allowsDecimals: false },
    { name: "Kilogramo", symbol: "kg", type: "WEIGHT", allowsDecimals: true },
    { name: "Gramo", symbol: "g", type: "WEIGHT", allowsDecimals: true },
    { name: "Litro", symbol: "L", type: "VOLUME", allowsDecimals: true },
    { name: "Mililitro", symbol: "ml", type: "VOLUME", allowsDecimals: true }
  ] as const;

  for (const unit of units) await db.unitOfMeasure.upsert({ where: { symbol: unit.symbol }, create: unit, update: unit });

  const categories = ["Abarrotes", "Aceites y grasas", "Arroz y cereales", "Azúcar y endulzantes", "Menestras", "Harinas y repostería", "Pastas y fideos", "Conservas", "Atunes y pescados en conserva", "Condimentos y especias", "Salsas y aderezos", "Infusiones y café", "Panadería y bizcochos", "Galletas", "Snacks", "Golosinas", "Chocolates", "Caramelos y chicles", "Bebidas", "Agua", "Gaseosas", "Jugos y refrescos", "Bebidas energéticas y deportivas", "Bebidas instantáneas", "Lácteos", "Yogurt", "Leche", "Quesos", "Mantequilla y margarina", "Huevos", "Carnes y aves", "Pollo", "Embutidos", "Congelados", "Helados", "Frutas y verduras", "Limpieza", "Detergentes", "Lavavajillas", "Lejías y desinfectantes", "Limpiadores", "Suavizantes", "Esponjas y paños", "Higiene personal", "Cuidado personal", "Cuidado bucal", "Cuidado capilar", "Jabones", "Desodorantes", "Papel e higiene", "Papel higiénico", "Servilletas y papel toalla", "Pañales y toallitas", "Botiquín y primeros auxilios", "Desechables", "Bolsas y empaques", "Mascotas", "Alimento para mascotas", "Útiles escolares y oficina", "Pilas y accesorios", "Otros"] as const;

  for (const name of categories) {
    const slug = toSlug(name);
    await db.productCategory.upsert({ where: { slug }, create: { name, slug }, update: { name, active: true } });
  }

  const brands = [
    "Coca-Cola", "Inca Kola", "Fanta", "Sprite", "Schweppes", "San Luis", "Powerade",
    "Pepsi", "7UP", "Concordia", "Triple Kola", "KR", "Oro", "Cielo", "Sporade",
    "Gloria", "Pura Vida", "Laive", "Nestlé", "Ideal", "Bonlé",
    "Alicorp", "Primor", "Cocinero", "Don Vittorio", "Lavaggi", "Molitalia", "Costeño",
    "Paisana", "Florida", "Campomar", "San Jorge", "Field", "Sublime", "Soda V",
    "Ángel", "Casino", "Pícaras", "Chips Ahoy!", "Oreo", "Ritz",
    "Bolívar", "Marsella", "Opal", "Ace", "Ariel", "Sapolio", "Ayudín",
    "Poett", "Suave", "Elite", "Scott", "Huggies", "Pampers",
    "Colgate", "Dento", "Sedal", "Pantene", "Head & Shoulders", "Dove", "Rexona", "Nivea",
    "Ricocan", "Mimaskot", "Dog Chow"
  ] as const;

  for (const name of brands) {
    await db.brand.upsert({ where: { name }, create: { name }, update: { active: true } });
  }

  for (const name of ["Servicios", "Movilidad", "Limpieza", "Mantenimiento", "Alimentación", "Bolsas", "Compras menores", "Otros"]) await db.expenseCategory.upsert({ where: { name }, create: { name }, update: { active: true } });

  await db.businessSettings.upsert({ where: { id: "singleton" }, create: {}, update: {} });
  await db.cashRegister.upsert({ where: { name: "Caja principal" }, create: { name: "Caja principal" }, update: { active: true } });

  const general = await db.customer.findFirst({ where: { general: true } });
  if (!general) await db.customer.create({ data: { legalName: "CLIENTE GENERAL", general: true, creditLimit: 0 } });
}

main().catch(error => {
  console.error("Error ejecutando seed:", error);
  process.exitCode = 1;
}).finally(async () => {
  await db.$disconnect();
});