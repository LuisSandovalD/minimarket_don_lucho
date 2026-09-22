"use client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
    const label = theme === "light" ? "Claro" : theme === "dark" ? "Oscuro" : "Sistema";

    return <Button type="button" variant="ghost" size="icon" className="rounded-xl" aria-label={`Tema actual: ${label}. Cambiar a ${nextTheme}`} title={`Tema: ${label}`} onClick={() => setTheme(nextTheme)}><Icon className="size-4" /></Button>;
}