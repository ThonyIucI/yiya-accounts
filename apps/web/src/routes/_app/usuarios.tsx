import { Button } from "@yiya/ui/components/button";
import { Skeleton } from "@yiya/ui/components/skeleton";
import { EUserRole, userRoleLabels } from "@yiya/shared/roles";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { formatShortDate } from "@/common/utils/format-date";
import UserFormModal from "@/modules/users/components/user-form-modal";
import { useUsers } from "@/modules/users/hooks/use-users";

export const Route = createFileRoute("/_app/usuarios")({
  /* Solo el superadmin. El server igual lo rechaza: esto es para no mostrar la pantalla. */
  beforeLoad: ({ context }) => {
    if (context.user.role !== EUserRole.SUPERADMIN) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: UsersPage,
});

function UsersPage() {
  const UserList = useUsers();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    UserList.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty = !UserList.loading && UserList.users.length === 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-foreground">Usuarios</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Quienes pueden entrar a la plataforma. Tú creas sus accesos.
        </p>
      </header>

      <Button className="w-full" onClick={() => setIsCreating(true)}>
        <Plus />
        Nuevo usuario
      </Button>

      {UserList.loading && UserList.users.length === 0 && (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-3xl" />
        </div>
      )}

      {isEmpty && (
        <div className="mt-6 flex flex-col items-center rounded-3xl border-2 border-dashed border-border px-6 py-12 text-center">
          <Users className="size-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="mt-3 font-heading text-lg font-bold text-foreground">Aún no hay usuarios</p>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {UserList.users.map((user) => (
          <li
            key={user.id}
            className="rounded-3xl border-2 border-border bg-card p-5 shadow-sticker"
          >
            <p className="font-heading text-lg font-bold break-words text-foreground">
              {user.name}
            </p>
            <p className="truncate text-base text-muted-foreground">{user.email}</p>
            <p className="mt-2 text-sm font-bold text-muted-foreground uppercase">
              {userRoleLabels[user.role]} · desde {formatShortDate(user.createdAt)}
            </p>
          </li>
        ))}
      </ul>

      <UserFormModal
        open={isCreating}
        onClose={() => setIsCreating(false)}
        onSubmit={async (payload) => {
          const created = await UserList.create(payload);
          if (created) {
            setIsCreating(false);
          }
        }}
      />
    </div>
  );
}
