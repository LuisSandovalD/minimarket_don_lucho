"use client";
<<<<<<< HEAD

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryProvider } from "./query-provider";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
            <QueryProvider>{children}</QueryProvider>
        </NextThemesProvider>
    );
}
=======
import { ThemeProvider as Provider } from "next-themes";
export function ThemeProvider({ children }: { children: React.ReactNode }) { return <Provider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>{children}</Provider>; }
>>>>>>> 3008127dd0bdc883b181438f1db61d13f3f5c6a9
