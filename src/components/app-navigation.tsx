"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ReceiptText, Package, ClipboardList, WalletCards, Wrench, FileSpreadsheet, ChartNoAxesCombined, Users, ShieldCheck, History, Settings, LogOut, UserRound, ChevronDown } from "lucide-react";
import { logoutAction } from "@/modules/auth/actions";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "./ui/sidebar";
import { ThemeToggle } from "./theme-toggle";

type NavItem = { label: string; href: string; icon: LucideIcon; permissions: string[]; paths: string[] };
type NavigationUser = { name: string; roles: string[]; permissions: string[] };
type AppNavigationProps = { user: NavigationUser; cashOpen: boolean; children: ReactNode };

const logoImage = process.env.NEXT_PUBLIC_LOGO_IMAGE;

const navigationSections: { label: string; items: NavItem[] }[] = [
    {
        label: "Principal",
        items: [
            { label: "Inicio", href: "/dashboard", icon: LayoutDashboard, permissions: ["dashboard.view"], paths: ["/dashboard"] },
        ],
    },
    {
        label: "Comercial",
        items: [
            { label: "Ventas", href: "/sales", icon: ReceiptText, permissions: ["sales.view", "sales.create", "customers.view", "credits.view"], paths: ["/sales", "/pos", "/manage/customers", "/credits"] },
            { label: "Productos", href: "/products", icon: Package, permissions: ["products.view", "inventory.view"], paths: ["/products", "/inventory", "/manage/categories", "/manage/brands", "/manage/units"] },
            { label: "Compras", href: "/purchases", icon: ClipboardList, permissions: ["purchases.view", "purchases.create", "suppliers.view"], paths: ["/purchases", "/manage/suppliers"] },
        ],
    },
    {
        label: "Control y caja",
        items: [
            { label: "Finanzas", href: "/finance", icon: WalletCards, permissions: ["cash.view", "expenses.view"], paths: ["/finance", "/cash", "/expenses"] },
            { label: "Operaciones", href: "/operations", icon: Wrench, permissions: ["dashboard.view"], paths: ["/operations"] },
        ],
    },
    {
        label: "Gestión",
        items: [
            { label: "Importaciones", href: "/imports", icon: FileSpreadsheet, permissions: ["imports.view"], paths: ["/imports"] },
            { label: "Reportes", href: "/reports", icon: ChartNoAxesCombined, permissions: ["reports.sales", "reports.inventory", "reports.profit", "reports.cash", "reports.credits"], paths: ["/reports"] },
        ],
    },
    {
        label: "Administración",
        items: [
            { label: "Usuarios", href: "/manage/users", icon: Users, permissions: ["users.view"], paths: ["/manage/users"] },
            { label: "Roles y permisos", href: "/manage/roles", icon: ShieldCheck, permissions: ["roles.view"], paths: ["/manage/roles"] },
            { label: "Auditoría", href: "/audit", icon: History, permissions: ["audit.view"], paths: ["/audit"] },
            { label: "Configuración", href: "/settings", icon: Settings, permissions: ["settings.view"], paths: ["/settings"] },
        ],
    },
];

function NavigationMenu({ items, activeHref }: { items: NavItem[]; activeHref?: string }) {
    return (
        <SidebarMenu>
            {items.map(({ label, href, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={activeHref === href} tooltip={label}>
                        <Link href={href}><Icon /><span>{label}</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}

function UserAvatar({ name }: { name: string }) {
    const initials = name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();
    return <Avatar className="size-8"><AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback></Avatar>;
}

export function AppNavigation({ user, cashOpen, children }: AppNavigationProps) {
    const path = usePathname();
    const visibleSections = navigationSections
        .map(section => ({ ...section, items: section.items.filter(item => item.permissions.some(permission => user.permissions.includes(permission))) }))
        .filter(section => section.items.length > 0);
    const active = visibleSections.flatMap(section => section.items).find(item => item.paths.some(itemPath => path === itemPath || path.startsWith(`${itemPath}/`)));
    const role = user.roles[0] ?? "Usuario";
    const canSettings = user.permissions.includes("settings.view");

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon" variant="inset">
                <SidebarHeader className="p-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild size="lg" tooltip="Minimarket Don Lucho" className="h-14 p-1 hover:bg-transparent">
                                <Link href="/dashboard" className="flex items-center gap-3">
                                    {logoImage && <div className="relative size-10 shrink-0"><Image src={logoImage} alt="Minimarket Don Lucho" fill priority sizes="40px" className="object-contain" /></div>}
                                    <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                                        <p className="truncate text-sm font-semibold">Minimarket Don Lucho</p>
                                        <p className="truncate text-xs text-muted-foreground">Gestión comercial</p>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    {visibleSections.map(section => (
                        <SidebarGroup key={section.label}>
                            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <NavigationMenu items={section.items} activeHref={active?.href} />
                            </SidebarGroupContent>
                        </SidebarGroup>
                    ))}
                </SidebarContent>

                <SidebarFooter className="p-2">
                    <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/70 p-2 group-data-[collapsible=icon]:justify-center">
                        <UserAvatar name={user.name} />
                        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                            <p className="truncate text-sm font-medium">{user.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{role}</p>
                        </div>
                    </div>
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>

            <SidebarInset className="min-w-0">
                <header className="sticky top-0 z-30 flex h-14 items-center bg-background/85 px-3 shadow-sm backdrop-blur-xl sm:h-16 sm:px-4 md:px-6">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <SidebarTrigger />
                        <div className="min-w-0">
                            <h1 className="truncate text-sm font-semibold sm:text-base">{active?.label ?? "Minimarket Don Lucho"}</h1>
                            <p className="hidden text-xs text-muted-foreground md:block">Gestión interna del minimarket</p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="secondary" className="hidden rounded-full px-3 py-1 font-normal lg:flex">
                            <span className={`mr-2 size-2 rounded-full ${cashOpen ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                            {cashOpen ? "Caja abierta" : "Caja cerrada"}
                        </Badge>

                        <ThemeToggle />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 gap-2 rounded-xl px-2">
                                    <UserAvatar name={user.name} />
                                    <span className="hidden max-w-32 truncate text-sm xl:block">{user.name}</span>
                                    <ChevronDown className="hidden size-3.5 text-muted-foreground xl:block" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 border-0 shadow-xl">
                                <DropdownMenuLabel>
                                    <p>{user.name}</p>
                                    <p className="text-xs font-normal text-muted-foreground">{user.roles.join(", ")}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild><Link href="/profile"><UserRound className="size-4" />Perfil</Link></DropdownMenuItem>
                                {canSettings && <DropdownMenuItem asChild><Link href="/settings"><Settings className="size-4" />Configuración</Link></DropdownMenuItem>}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onSelect={() => void logoutAction()}><LogOut className="size-4" />Cerrar sesión</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden">
                    <div className="mx-auto w-full max-w-[1800px] p-3 sm:p-4 md:p-6">{children}</div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}