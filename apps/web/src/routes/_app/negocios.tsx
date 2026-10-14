import { Button } from "@yiya/ui/components/button";
import type { IBusinessResource } from "@yiya/shared/businesses";
import { EUserRole } from "@yiya/shared/roles";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Pencil, Plus, Store } from "lucide-react";
import { useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import EmptyState from "@/common/components/empty-state";
import PageHeader from "@/common/components/page-header";
import type { IRowAction } from "@/common/components/row-actions";
import { useBoolean } from "@/common/hooks/use-boolean";
import BusinessFormModal from "@/modules/businesses/components/business-form-modal";
import BusinessMobileList from "@/modules/businesses/components/business-mobile-list";
import BusinessTable from "@/modules/businesses/components/business-table";
import { useActiveBusiness } from "@/modules/businesses/context/active-business";
import { useListBusinesses } from "@/modules/businesses/hooks/use-list-businesses";
import { useUpdateBusiness } from "@/modules/businesses/hooks/use-update-business";
import { useUsers } from "@/modules/users/hooks/use-users";

export const Route = createFileRoute("/_app/negocios")({
  /* Solo el superadmin. El server igual lo rechaza: esto es para no mostrar la pantalla. */
  beforeLoad: ({ context }) => {
    if (context.user.role !== EUserRole.SUPERADMIN) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: BusinessesPage,
});

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

function BusinessesPage() {
  const ListBusinesses = useListBusinesses();
  const UserList = useUsers();
  const UpdateBusiness = useUpdateBusiness();
  const ActiveBusiness = useActiveBusiness();
  const showForm = useBoolean();

  const [editTarget, setEditTarget] = useState<IBusinessResource | undefined>();
  const [deactivateTarget, setDeactivateTarget] = useState<IBusinessResource | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    ListBusinesses.handler(controller.signal);
    UserList.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { businesses } = ListBusinesses;
  const isLoading = ListBusinesses.loading && businesses.length === 0;
  const activeCount = businesses.filter((business) => business.isActive).length;
  const availableOwners = UserList.users.filter(
    (user) => user.role === EUserRole.USER && user.business === null,
  );

  const openCreate = () => {
    setEditTarget(undefined);
    showForm.on();
  };

  const openEdit = (business: IBusinessResource) => {
    setEditTarget(business);
    showForm.on();
  };

  /*
    El usuario elegido como dueño deja de estar libre: se vuelve a pedir la lista. El select
    del menú lateral también se actualiza (nombre nuevo, o el primer negocio creado).
  */
  const handleSaved = (saved: IBusinessResource) => {
    ListBusinesses.onUpsert(saved);
    ActiveBusiness.refresh();
    if (!editTarget) {
      UserList.handler();
    }
  };

  const setActive = async (business: IBusinessResource, isActive: boolean) => {
    setTogglingId(business.id);
    const saved = await UpdateBusiness.handler(business.id, { isActive });
    setTogglingId(null);
    if (saved) {
      ListBusinesses.onUpsert(saved);
      ActiveBusiness.refresh();
    }
  };

  /* Desactivar deja afuera al cliente: se confirma. Activar no hace daño, va directo. */
  const handleToggleActive = (business: IBusinessResource) => {
    /* El switch no se apaga mientras guarda: un toque más no manda otro cambio. */
    if (togglingId) {
      return;
    }
    if (business.isActive) {
      setDeactivateTarget(business);
      return;
    }
    setActive(business, true);
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) {
      return;
    }
    await setActive(deactivateTarget, false);
    setDeactivateTarget(null);
  };

  const buildActions = (business: IBusinessResource): IRowAction[] => [
    { icon: Pencil, label: "Editar", onClick: () => openEdit(business) },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6">
      <PageHeader
        title="Negocios"
        subtitle={
          businesses.length > 0
            ? `${pluralize(businesses.length, "negocio", "negocios")} · ${pluralize(activeCount, "activo", "activos")}`
            : undefined
        }
        isLoadingSubtitle={isLoading}
        action={
          <Button type="button" onClick={openCreate}>
            <Plus />
            Crear
          </Button>
        }
      />

      {!isLoading && businesses.length === 0 && (
        <EmptyState
          icon={Store}
          title="Aún no hay negocios"
          description="Cada cliente que alquila perfiles es un negocio, con su propio dueño."
          action={
            <Button type="button" variant="link" onClick={openCreate}>
              Crear el primero
            </Button>
          }
        />
      )}

      {(isLoading || businesses.length > 0) && (
        <>
          <BusinessTable
            businesses={businesses}
            isLoading={isLoading}
            buildActions={buildActions}
            togglingId={togglingId}
            onToggleActive={handleToggleActive}
          />
          <BusinessMobileList
            businesses={businesses}
            isLoading={isLoading}
            buildActions={buildActions}
            togglingId={togglingId}
            onToggleActive={handleToggleActive}
          />
        </>
      )}

      <BusinessFormModal
        open={showForm.active}
        business={editTarget}
        availableOwners={availableOwners}
        onSaved={handleSaved}
        onClose={showForm.off}
      />

      <ConfirmModal
        open={deactivateTarget !== null}
        title={`¿Desactivar «${deactivateTarget?.name ?? ""}»?`}
        description="Su dueño no podrá entrar hasta que lo vuelvas a activar. No se borra ningún dato."
        confirmLabel="Desactivar"
        variant="destructive"
        loading={togglingId !== null}
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
