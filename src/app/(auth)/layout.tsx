import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

const authImage = process.env.NEXT_PUBLIC_AUTH_IMAGE;
const logoImage = process.env.NEXT_PUBLIC_LOGO_IMAGE;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <main className="min-h-svh bg-background text-foreground">
        <div className="grid min-h-svh lg:grid-cols-[minmax(0,1.4fr)_minmax(420px,.6fr)]">
            <section className="relative hidden overflow-hidden border-r border-border/50 lg:block">
                <Image src={authImage || "/images/auth-minimarket.jpg"} alt="Minimarket Don Lucho" fill priority sizes="70vw" className="object-cover object-center" />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10" />

                <div className="absolute inset-x-0 bottom-0 z-10 p-10 xl:p-14 2xl:p-16">
                    <div className="max-w-2xl">
                        <p className="mb-4 text-xs font-medium uppercase tracking-[.2em] text-white/55">Sistema de gestión comercial</p>
                        <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-.03em] text-white xl:text-5xl 2xl:text-6xl">Todo tu negocio, en un solo lugar.</h1>
                        <p className="mt-5 max-w-lg text-sm leading-6 text-white/65 xl:text-base">Ventas, inventario, caja, compras, clientes y fiados con una experiencia simple, rápida y ordenada.</p>
                    </div>
                </div>
            </section>

            <section className="relative flex min-h-svh flex-col bg-background">
                <div className="flex flex-1 flex-col px-5 py-5 sm:px-8 lg:px-10 lg:py-8 xl:px-14">
                    <div className="flex items-center justify-end"><ThemeToggle /></div>

                    <div className="flex flex-1 items-center justify-center py-8">
                        <div className="w-full max-w-sm">
                            {logoImage && <div className="mb-7 flex justify-center">
                                <div className="relative h-24 w-24">
                                    <Image src={logoImage} alt="Logo Minimarket Don Lucho" fill priority sizes="96px" className="object-contain" />
                                </div>
                            </div>}

                            <div className="relative">
                                {children}
                            </div>
                        </div>
                    </div>

                    <div className="pb-1 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Minimarket Don Lucho</div>
                </div>
            </section>
        </div>
    </main>;
}
