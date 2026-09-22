import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackToModule({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
      <Link href={href}>
        <ArrowLeft className="size-4" />
        Volver a {label}
      </Link>
    </Button>
  );
}
