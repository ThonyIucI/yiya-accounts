import { createFileRoute } from "@tanstack/react-router";

import { userRoleLabels } from "@yiya/shared/roles";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useRouteContext();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">Hola, {user.name}</h1>
      <p className="mt-1 text-muted-foreground">Rol: {userRoleLabels[user.role]}</p>

      <div className="mt-6 rounded-3xl border-2 border-dashed border-border p-6 text-center text-base text-muted-foreground">
        Negocios, cuentas, perfiles y alquileres llegan en las próximas etapas.
      </div>
    </div>
  );
}
