"use client";

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
