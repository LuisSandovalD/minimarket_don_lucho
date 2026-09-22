import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppNavigation } from "./app-navigation";

export async function PanelShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const cashOpen = !!(await db.cashSession.findFirst({ where: { userId: user.id, status: "OPEN" }, select: { id: true } }));
  return <AppNavigation user={user} cashOpen={cashOpen}>{children}</AppNavigation>;
}
