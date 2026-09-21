import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const variants = cva("inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2", { variants: { variant: { default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90", secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-50", ghost: "hover:bg-slate-100 dark:hover:bg-slate-800", destructive: "bg-[var(--danger)] text-white" }, size: { default: "h-10 px-4", sm: "h-8 px-3", icon: "size-10 px-0" } }, defaultVariants: { variant: "default", size: "default" } });
export function Button({ className, variant, size, asChild, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variants> & { asChild?: boolean }) { const Comp = asChild ? Slot : "button"; return <Comp className={cn(variants({ variant, size }), className)} {...props} />; }
