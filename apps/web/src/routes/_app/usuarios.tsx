import { Button } from "@yiya/ui/components/button";
import { EUserRole } from "@yiya/shared/roles";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";
import { useEffect } from "react";

import EmptyState from "@/common/components/empty-state";
import PageHeader from "@/common/components/page-header";
import { useBoolean } from "@/common/hooks/use-boolean";
import UserFormModal from "@/modules/users/components/user-form-modal";
import UserList from "@/modules/users/components/user-list";
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
  const UserListRequest = useUsers();
  const showForm = useBoolean();

  useEffect(() => {
    const controller = new AbortController();
    UserListRequest.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { users } = UserListRequest;
  const isLoading = UserListRequest.loading && users.length === 0;
  const withoutBusiness = users.filter(
    (user) => user.role === EUserRole.USER && user.business === null,
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6">
      <PageHeader
        title="Usuarios"
        subtitle={
          users.length > 0
            ? `${users.length} ${users.length === 1 ? "usuario" : "usuarios"} · ${withoutBusiness} sin negocio`
            : undefined
        }
        isLoadingSubtitle={isLoading}
        action={
          <Button type="button" onClick={showForm.on}>
            <Plus />
            Crear
          </Button>
        }
      />

      {!isLoading && users.length === 0 ? (
        <EmptyState icon={Users} title="Aún no hay usuarios" />
      ) : (
        <UserList users={users} isLoading={isLoading} />
      )}

      <UserFormModal
        open={showForm.active}
        onClose={showForm.off}
        onSubmit={async (payload) => {
          const created = await UserListRequest.create(payload);
          if (created) {
            showForm.off();
          }
        }}
      />
    </div>
  );
}
