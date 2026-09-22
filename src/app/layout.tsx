import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
<<<<<<< HEAD

export const metadata: Metadata = {
    title: {
        default: "Minimarket Don Lucho",
        template: "%s | Minimarket Don Lucho"
    },
    description: "Sistema comercial integral para Minimarket Don Lucho"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className="min-h-svh overflow-x-hidden bg-background text-foreground antialiased">
                <ThemeProvider>
                    <div className="min-h-svh">
                        {children}
                    </div>

                    <Toaster richColors position="top-right" />
                </ThemeProvider>
            </body>
        </html>
    );
}
=======
export const metadata: Metadata = { title: { default: "Minimarket Don Lucho", template: "%s | Minimarket Don Lucho" }, description: "Sistema comercial integral para Minimarket Don Lucho" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es" suppressHydrationWarning><body><ThemeProvider>{children}<Toaster richColors position="top-right" /></ThemeProvider></body></html>; }
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
