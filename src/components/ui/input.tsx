import * as React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cn("h-10 w-full rounded-lg bg-[var(--card)] px-3 text-sm ring-1 ring-[var(--border)] placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--primary)]", className)} {...props} />);
Input.displayName = "Input";
