import { notFound } from "next/navigation";
import { catalogConfig } from "@/modules/admin/config";
import { listCatalog } from "@/modules/admin/service";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { CatalogManager } from "@/components/catalog-manager";
import { BackToModule } from "@/components/back-to-module";

const parents: Record<string, { href: string; label: string }> = {
  categories: { href: "/products", label: "Productos" },
  brands: { href: "/products", label: "Productos" },
  units: { href: "/products", label: "Productos" },
  suppliers: { href: "/purchases", label: "Compras" },
  customers: { href: "/sales", label: "Ventas" }
};

export default async function Page({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<{ page?: string; q?: string }> }) {
  const { kind } = await params;
  if (!catalogConfig[kind]) notFound();
  const config = catalogConfig[kind];
  const actor = await requirePermission(config.view);
  const s = await searchParams;
  const page = Math.max(1, Math.floor(Number(s.page) || 1));
  const q = (s.q ?? "").slice(0, 100);
  const data = await listCatalog(kind, page, q);
  const categories = kind === "categories" ? await db.productCategory.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : [];
  const roles = kind === "users" && actor.permissions.includes("roles.manage") ? await db.role.findMany({ where: { active: true }, select: { id: true, name: true } }) : [];
  const permissions = kind === "roles" ? await db.permission.findMany({ select: { id: true, key: true }, orderBy: { key: "asc" } }) : [];
  const parent = parents[kind];

  return (
    <div className="space-y-4">
      {parent && <BackToModule href={parent.href} label={parent.label} />}
      <CatalogManager kind={kind} rows={JSON.parse(JSON.stringify(data.rows))} total={data.total} page={page} query={q} options={{ parentId: categories, roleId: roles }} permissions={permissions} canCreate={actor.permissions.includes(config.create)} canUpdate={actor.permissions.includes(config.update)} />
    </div>
  );
}
