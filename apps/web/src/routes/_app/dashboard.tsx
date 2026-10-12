import { Skeleton } from "@yiya/ui/components/skeleton";
import { businessRoleLabels } from "@yiya/shared/businesses";
import { EUserRole, userRoleLabels } from "@yiya/shared/roles";
import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { useEffect } from "react";

import { useMyBusiness } from "@/modules/businesses/hooks/use-my-business";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const isSuperadmin = user.role === EUserRole.SUPERADMIN;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground md:text-3xl">
          Hola, {user.name}
        </h1>
        {isSuperadmin && (
          <p className="mt-0.5 text-base text-muted-foreground">{userRoleLabels[user.role]}</p>
        )}
      </div>

      {!isSuperadmin && <MyBusinessCard />}

      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-base text-muted-foreground">
        Cuentas, perfiles y alquileres llegan en las próximas etapas.
      </div>
    </div>
  );
}

function MyBusinessCard() {
  const MyBusiness = useMyBusiness();

  useEffect(() => {
    const controller = new AbortController();
    MyBusiness.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (MyBusiness.loading) {
    return <Skeleton className="h-20 w-full rounded-2xl" />;
  }
  if (!MyBusiness.business) {
    return null;
  }

  return (
    <article className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Store className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-heading text-lg font-bold text-foreground">
          {MyBusiness.business.name}
        </p>
        <p className="text-base text-muted-foreground">
          {businessRoleLabels[MyBusiness.business.role]}
        </p>
      </div>
    </article>
  );
}
