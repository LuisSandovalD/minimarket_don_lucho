"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
export function ThemeToggle() { const { resolvedTheme, setTheme } = useTheme(); return <Button type="button" variant="ghost" size="icon" aria-label="Cambiar tema" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? <Sun className="size-4"/> : <Moon className="size-4"/>}</Button>; }
