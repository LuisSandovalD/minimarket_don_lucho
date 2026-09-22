import { BackToModule } from "@/components/back-to-module";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4"><BackToModule href="/sales" label="Ventas" />{children}</div>;
}
