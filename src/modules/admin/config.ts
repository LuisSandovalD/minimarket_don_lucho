import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  Building2,
  ContactRound,
  Layers3,
  Ruler,
  ShieldCheck,
  Tags,
  Users
} from "lucide-react";

export type AdminField = {
  key: string;
  label: string;
  type?: "text" | "number" | "email" | "password" | "textarea" | "boolean" | "select";
  required?: boolean;
  options?: string[];
};

export type CatalogConfig = {
  title: string;
  view: string;
  create: string;
  update: string;
  icon: LucideIcon;
  fields: AdminField[];
};

export const catalogConfig: Record<string, CatalogConfig> = {
  categories: {
    title: "Categorías",
    view: "products.view",
    create: "products.create",
    update: "products.update",
    icon: Layers3,
    fields: [
      { key: "name", label: "Nombre", required: true },
      { key: "description", label: "Descripción", type: "textarea" },
      { key: "parentId", label: "Categoría padre", type: "select" },
      { key: "active", label: "Activo", type: "boolean" }
    ]
  },

  brands: {
    title: "Marcas",
    view: "products.view",
    create: "products.create",
    update: "products.update",
    icon: Tags,
    fields: [
      { key: "name", label: "Nombre", required: true },
      { key: "active", label: "Activo", type: "boolean" }
    ]
  },

  units: {
    title: "Unidades",
    view: "products.view",
    create: "products.create",
    update: "products.update",
    icon: Ruler,
    fields: [
      { key: "name", label: "Nombre", required: true },
      { key: "symbol", label: "Símbolo", required: true },
      { key: "type", label: "Tipo", type: "select", options: ["QUANTITY", "WEIGHT", "VOLUME", "OTHER"] },
      { key: "allowsDecimals", label: "Admite decimales", type: "boolean" },
      { key: "active", label: "Activo", type: "boolean" }
    ]
  },

  suppliers: {
    title: "Proveedores",
    view: "suppliers.view",
    create: "suppliers.create",
    update: "suppliers.update",
    icon: Building2,
    fields: [
      { key: "legalName", label: "Razón social", required: true },
      { key: "tradeName", label: "Nombre comercial" },
      { key: "ruc", label: "RUC" },
      { key: "contactName", label: "Contacto" },
      { key: "phone", label: "Teléfono" },
      { key: "email", label: "Correo", type: "email" },
      { key: "address", label: "Dirección" },
      { key: "notes", label: "Observaciones", type: "textarea" },
      { key: "active", label: "Activo", type: "boolean" }
    ]
  },

  customers: {
    title: "Clientes",
    view: "customers.view",
    create: "customers.create",
    update: "customers.update",
    icon: ContactRound,
    fields: [
      { key: "firstName", label: "Nombres" },
      { key: "lastName", label: "Apellidos" },
      { key: "legalName", label: "Razón social" },
      { key: "dni", label: "DNI" },
      { key: "ruc", label: "RUC" },
      { key: "phone", label: "Teléfono" },
      { key: "email", label: "Correo", type: "email" },
      { key: "address", label: "Dirección" },
      { key: "creditLimit", label: "Límite de crédito", type: "number" },
      { key: "notes", label: "Observaciones", type: "textarea" },
      { key: "active", label: "Activo", type: "boolean" }
    ]
  },

  users: {
    title: "Usuarios",
    view: "users.view",
    create: "users.create",
    update: "users.update",
    icon: Users,
    fields: [
      { key: "name", label: "Nombre", required: true },
      { key: "email", label: "Correo", type: "email", required: true },
      { key: "password", label: "Contraseña (solo alta)", type: "password" },
      { key: "roleId", label: "Rol", type: "select", required: true },
      { key: "active", label: "Activo", type: "boolean" }
    ]
  },

  roles: {
    title: "Roles y permisos",
    view: "roles.view",
    create: "roles.manage",
    update: "roles.manage",
    icon: ShieldCheck,
    fields: [
      { key: "name", label: "Nombre", required: true },
      { key: "description", label: "Descripción", type: "textarea" },
      { key: "active", label: "Activo", type: "boolean" }
    ]
  },

  "expense-categories": {
    title: "Categorías de gastos",
    view: "expenses.view",
    create: "expenses.create",
    update: "expenses.create",
    icon: BadgeDollarSign,
    fields: [
      { key: "name", label: "Nombre", required: true },
      { key: "active", label: "Activo", type: "boolean" }
    ]
  }
};