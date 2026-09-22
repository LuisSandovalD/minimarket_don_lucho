import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requirePermission("users.view");

  const users = await db.user.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Usuarios
            </h1>
          </div>

          <p className="text-sm text-muted-foreground">
            Gestiona los usuarios y roles del sistema.
          </p>
        </div>

        <Badge
          variant="secondary"
          className="w-fit rounded-full px-3 py-1 font-normal"
        >
          {users.length} usuarios
        </Badge>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Usuario</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {users.length ? (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-muted/40"
                    >
                      <TableCell className="pl-6 font-medium">
                        {user.name}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length ? (
                            user.roles.map(({ role }) => (
                              <Badge
                                key={role.id}
                                variant="secondary"
                                className="font-normal"
                              >
                                {role.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Sin rol
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            user.active
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-700 dark:text-red-400"
                          }
                        >
                          {user.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4}>
                      <div className="flex min-h-52 flex-col items-center justify-center text-center">
                        <Users className="mb-3 size-9 text-muted-foreground/40" />
                        <p className="text-sm font-medium">
                          Sin usuarios registrados
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Los usuarios del sistema aparecerán aquí.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}