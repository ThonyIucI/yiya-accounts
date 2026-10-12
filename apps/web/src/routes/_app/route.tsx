import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { parseUserRole } from "@yiya/shared/roles";

import { authClient } from "@/lib/auth-client";
import { useActiveBusiness } from "@/modules/businesses/context/active-business";

/** Layout de todas las pantallas con sesión. Sin sesión → /login. */
export const Route = createFileRoute("/_app")({
  component: AppLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();

    if (!session.data) {
      throw redirect({ to: "/login" });
    }

    const role = parseUserRole(session.data.user.role);
    return { user: { ...session.data.user, role } };
  },
});

/*
  Cuando el superadmin cambia de negocio, `version` sube y la pantalla se vuelve a montar:
  así pide sus datos otra vez, ya del negocio nuevo. Para el dueño siempre es 0.
*/
function AppLayout() {
  const { version } = useActiveBusiness();
  return <Outlet key={version} />;
}
