import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission, hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { transact } from "@/lib/transaction";
import { catalogConfig } from "./config";
const text = z.string().trim().max(2000).default("");
const optional = text.transform(v => v || null);
const name = z.string().trim().min(2).max(180);
const active = z.boolean().default(true);
const ruc = z.string().regex(/^\d{11}$/).or(z.literal("")).optional().transform(v => v || null);
const email = z.email().or(z.literal("")).optional().transform(v => v?.toLowerCase() || null);
const schemas = {
  categories: z.object({ name, description: optional, parentId: optional, active }),
  brands: z.object({ name, active }),
  units: z.object({ name, symbol: z.string().trim().min(1).max(20), type: z.enum(["QUANTITY", "WEIGHT", "VOLUME", "OTHER"]), allowsDecimals: z.boolean().default(false), active }),
  suppliers: z.object({ legalName: name, tradeName: optional, ruc, contactName: optional, phone: optional, email, address: optional, notes: optional, active }),
  customers: z.object({ firstName: optional, lastName: optional, legalName: optional, dni: z.string().regex(/^\d{8}$/).or(z.literal("")).optional().transform(v => v || null), ruc, phone: optional, email, address: optional, notes: optional, creditLimit: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/).default("0"), active }).refine(v => v.firstName || v.legalName, "Ingresa nombres o razón social."),
  users: z.object({ name, email: z.email().transform(v => v.toLowerCase()), password: text, roleId: z.string().min(1), active }),
  roles: z.object({ name, description: optional, active, permissionIds: z.array(z.string()).max(300) }),
  "expense-categories": z.object({ name, active })
};
export async function saveCatalog(kind: string, raw: unknown, id?: string) {
  const config = catalogConfig[kind]; if (!config || !(kind in schemas)) throw new AppError("NOT_FOUND", "Catálogo inválido.", 404);
  const actor = await requirePermission(id ? config.update : config.create);
  return transact(async tx => {
    let result: { id: string }; let before: unknown;
    if (kind === "categories") {
      const data = schemas.categories.parse(raw); const visited = new Set<string>(id ? [id] : []); let parent = data.parentId;
      while (parent) { if (visited.has(parent)) throw new AppError("CYCLE", "La jerarquía no puede contener ciclos."); visited.add(parent); const row = await tx.productCategory.findUniqueOrThrow({ where: { id: parent } }); parent = row.parentId; }
      before = id ? await tx.productCategory.findUniqueOrThrow({ where: { id } }) : null;
      const slug = data.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      result = id ? await tx.productCategory.update({ where: { id }, data: { ...data, slug } }) : await tx.productCategory.create({ data: { ...data, slug } });
    } else if (kind === "brands") { const data = schemas.brands.parse(raw); before = id ? await tx.brand.findUniqueOrThrow({ where: { id } }) : null; result = id ? await tx.brand.update({ where: { id }, data }) : await tx.brand.create({ data });
    } else if (kind === "units") { const data = schemas.units.parse(raw); before = id ? await tx.unitOfMeasure.findUniqueOrThrow({ where: { id } }) : null;
      if (id && await tx.product.count({ where: { unitOfMeasureId: id } })) { const unit = await tx.unitOfMeasure.findUniqueOrThrow({ where: { id } }); if (unit.type !== data.type || unit.allowsDecimals !== data.allowsDecimals) throw new AppError("UNIT_IN_USE", "No cambies la dimensión de una unidad en uso."); }
      result = id ? await tx.unitOfMeasure.update({ where: { id }, data }) : await tx.unitOfMeasure.create({ data });
    } else if (kind === "suppliers") { const data = schemas.suppliers.parse(raw); before = id ? await tx.supplier.findUniqueOrThrow({ where: { id } }) : null; result = id ? await tx.supplier.update({ where: { id }, data }) : await tx.supplier.create({ data });
    } else if (kind === "customers") { const data = schemas.customers.parse(raw); before = id ? await tx.customer.findUniqueOrThrow({ where: { id } }) : null; if (id && (await tx.customer.findUniqueOrThrow({ where: { id } })).general) throw new AppError("GENERAL_CUSTOMER", "Cliente General es un registro reservado."); result = id ? await tx.customer.update({ where: { id }, data }) : await tx.customer.create({ data });
    } else if (kind === "expense-categories") { const data = schemas["expense-categories"].parse(raw); before = id ? await tx.expenseCategory.findUniqueOrThrow({ where: { id } }) : null; result = id ? await tx.expenseCategory.update({ where: { id }, data }) : await tx.expenseCategory.create({ data });
    } else if (kind === "users") {
      const { password, roleId, ...data } = schemas.users.parse(raw); await requirePermission("roles.manage");
      const role = await tx.role.findFirst({ where: { id: roleId, active: true } }); if (!role) throw new AppError("ROLE", "Rol inválido.");
      if (id === actor.id) throw new AppError("SELF_UPDATE", "Otro administrador debe modificar tu rol o estado.");
      if (id) { const prior = await tx.user.findUniqueOrThrow({ where: { id }, include: { roles: { include: { role: true } } } }); before = { name: prior.name, email: prior.email, active: prior.active }; if (!data.active) await requirePermission("users.disable");
        if (prior.roles.some(r => r.role.name === "ADMINISTRADOR") && (!data.active || role.name !== "ADMINISTRADOR")) { const remaining = await tx.user.count({ where: { id: { not: id }, active: true, roles: { some: { role: { name: "ADMINISTRADOR", active: true } } } } }); if (!remaining) throw new AppError("LAST_ADMIN", "Debe existir un administrador activo."); }
        result = await tx.user.update({ where: { id }, data: { ...data, emailVerifiedAt: prior.email === data.email ? undefined : null } }); await tx.userRole.deleteMany({ where: { userId: id } }); await tx.session.deleteMany({ where: { userId: id } });
      } else { z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/).regex(/[^A-Za-z0-9]/).parse(password); result = await tx.user.create({ data: { ...data, passwordHash: await hashPassword(password) } }); }
      await tx.userRole.create({ data: { userId: result.id, roleId } });
    } else {
      const { permissionIds, ...data } = schemas.roles.parse(raw); const permissions = await tx.permission.findMany({ where: { id: { in: permissionIds } } }); if (permissions.length !== new Set(permissionIds).size) throw new AppError("PERMISSIONS", "Permisos inválidos.");
      const role = id ? await tx.role.findUniqueOrThrow({ where: { id } }) : null; before = role;
      if (role?.name === "ADMINISTRADOR" || (!id && data.name === "ADMINISTRADOR")) throw new AppError("PROTECTED_ROLE", "El rol administrador está protegido.");
      result = id ? await tx.role.update({ where: { id }, data }) : await tx.role.create({ data });
      await tx.rolePermission.deleteMany({ where: { roleId: result.id } }); await tx.rolePermission.createMany({ data: permissions.map(p => ({ roleId: result.id, permissionId: p.id })) });
    }
    await audit({ userId: actor.id, action: id ? "UPDATE" : "CREATE", module: "admin", resource: kind, resourceId: result.id, before, after: raw }, tx);
    return { id: result.id };
  });
}
export async function listCatalog(kind: string, page: number, q: string) {
  const config = catalogConfig[kind]; if (!config) throw new AppError("NOT_FOUND", "Catálogo inválido.", 404); await requirePermission(config.view);
  const skip = (page - 1) * 25, take = 25, contains = { contains: q, mode: "insensitive" as const };
  if (kind === "categories") return { rows: await db.productCategory.findMany({ where: { name: contains }, skip, take, orderBy: { name: "asc" } }), total: await db.productCategory.count({ where: { name: contains } }) };
  if (kind === "brands") return { rows: await db.brand.findMany({ where: { name: contains }, skip, take, orderBy: { name: "asc" } }), total: await db.brand.count({ where: { name: contains } }) };
  if (kind === "units") return { rows: await db.unitOfMeasure.findMany({ where: { name: contains }, skip, take, orderBy: { name: "asc" } }), total: await db.unitOfMeasure.count({ where: { name: contains } }) };
  if (kind === "suppliers") return { rows: await db.supplier.findMany({ where: { legalName: contains }, skip, take, orderBy: { legalName: "asc" } }), total: await db.supplier.count({ where: { legalName: contains } }) };
  if (kind === "customers") { const where = { OR: [{ firstName: contains }, { lastName: contains }, { legalName: contains }, { dni: contains }] }; return { rows: await db.customer.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }), total: await db.customer.count({ where }) }; }
  if (kind === "roles") { const rows = await db.role.findMany({ where: { name: contains }, skip, take, include: { permissions: true }, orderBy: { name: "asc" } }); return { rows: rows.map(r => ({ ...r, permissionIds: r.permissions.map(p => p.permissionId) })), total: await db.role.count({ where: { name: contains } }) }; }
  if (kind === "users") { const rows = await db.user.findMany({ where: { name: contains }, skip, take, select: { id: true, name: true, email: true, active: true, roles: { select: { roleId: true } } }, orderBy: { name: "asc" } }); return { rows: rows.map(r => ({ ...r, roleId: r.roles[0]?.roleId ?? "" })), total: await db.user.count({ where: { name: contains } }) }; }
  return { rows: await db.expenseCategory.findMany({ where: { name: contains }, skip, take, orderBy: { name: "asc" } }), total: await db.expenseCategory.count({ where: { name: contains } }) };
}
