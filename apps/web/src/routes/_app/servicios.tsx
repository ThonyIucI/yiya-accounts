import { Button } from "@yiya/ui/components/button";
import { EUserRole } from "@yiya/shared/roles";
import type { IBusinessServiceResource, ICatalogServiceResource } from "@yiya/shared/services";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Store, Tv } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";

import EmptyState from "@/common/components/empty-state";
import ListPagination, { ResultsCounter } from "@/common/components/list-pagination";
import PageHeader from "@/common/components/page-header";
import type { IRowAction } from "@/common/components/row-actions";
import SearchInput from "@/common/components/search-input";
import StickyToolbar from "@/common/components/sticky-toolbar";
import { useBoolean } from "@/common/hooks/use-boolean";
import { usePagination } from "@/common/hooks/use-pagination";
import { useActiveBusiness } from "@/modules/businesses/context/active-business";
import ActivateServiceModal from "@/modules/services/components/activate-service-modal";
import ServiceFormModal from "@/modules/services/components/service-form-modal";
import ServiceMobileList from "@/modules/services/components/service-mobile-list";
import ServiceTable from "@/modules/services/components/service-table";
import { useListBusinessServices } from "@/modules/services/hooks/use-list-business-services";
import { useListCatalog } from "@/modules/services/hooks/use-list-catalog";
import { useUpdateBusinessService } from "@/modules/services/hooks/use-update-business-service";
import {
  type IServiceListHandlers,
  type IServiceRow,
  type TPriceField,
  pluralize,
} from "@/modules/services/service-row";

export const Route = createFileRoute("/_app/servicios")({
  component: ServicesPage,
});

const PAGE_SIZE_OPTIONS = [10, 20, 50];
/* El dueño siempre está en su negocio; el id real lo resuelve el server. */
const OWN_BUSINESS = "own";

const byActiveThenName = (a: IServiceRow, b: IServiceRow) =>
  Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name, "es");

/**
 * Servicios: una sola pantalla para los dos roles (ver docs/planes/02-servicios-y-precios.md).
 * - Superadmin: el catálogo global (crear, editar, «activo en N negocios») y, dentro del
 *   negocio elegido en su menú lateral, el switch y los precios.
 * - Dueño: el catálogo dentro de su negocio: activa los que trabaja y les pone precio.
 */
function ServicesPage() {
  const { user } = Route.useRouteContext();
  const isSuperadmin = user.role === EUserRole.SUPERADMIN;

  const ActiveBusiness = useActiveBusiness();
  const Catalog = useListCatalog();
  const BusinessServices = useListBusinessServices();
  const UpdateBusinessService = useUpdateBusinessService();
  const showForm = useBoolean();

  const [editTarget, setEditTarget] = useState<ICatalogServiceResource | undefined>();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [activateTarget, setActivateTarget] = useState<IServiceRow | null>(null);
  const showActivate = useBoolean();
  const [search, setSearch] = useState("");

  const currentBusinessId = isSuperadmin ? (ActiveBusiness.current?.id ?? null) : OWN_BUSINESS;
  const canManageBusiness = currentBusinessId !== null;

  useEffect(() => {
    if (!isSuperadmin) {
      return;
    }
    const controller = new AbortController();
    Catalog.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!canManageBusiness) {
      return;
    }
    const controller = new AbortController();
    BusinessServices.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBusinessId]);

  /* El superadmin ve el catálogo completo; lo del negocio se le suma por servicio. */
  const businessById = new Map(BusinessServices.services.map((item) => [item.id, item]));
  const rows: IServiceRow[] = isSuperadmin
    ? Catalog.services.map((item) => {
        const offering = businessById.get(item.id);
        return {
          ...item,
          isActive: offering?.isActive ?? false,
          purchasePrice: offering?.purchasePrice ?? null,
          profilePrice: offering?.profilePrice ?? null,
        };
      })
    : BusinessServices.services;

  const term = search.trim().toLowerCase();
  const visible = rows
    .filter((row) => !term || row.name.toLowerCase().includes(term))
    .sort(byActiveThenName);
  const pager = usePagination(visible, { initialPageSize: PAGE_SIZE_OPTIONS[0] });

  const isLoading =
    rows.length === 0 &&
    (Catalog.loading || BusinessServices.loading || (isSuperadmin && ActiveBusiness.isLoading));
  const hasContent = !isLoading && visible.length > 0;
  const activeCount = rows.filter((row) => row.isActive).length;
  const hasNoBusinesses =
    isSuperadmin && !ActiveBusiness.isLoading && ActiveBusiness.businesses.length === 0;

  const subtitle = (() => {
    if (rows.length === 0) {
      return undefined;
    }
    const total = pluralize(rows.length, "servicio", "servicios");
    if (!canManageBusiness) {
      return total;
    }
    const active = pluralize(activeCount, "activo", "activos");
    const where = isSuperadmin && ActiveBusiness.current ? ` en «${ActiveBusiness.current.name}»` : "";
    return `${total} · ${active}${where}`;
  })();

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    pager.resetPage();
  };

  const openCreate = () => {
    setEditTarget(undefined);
    showForm.on();
  };

  const openEdit = (serviceId: string) => {
    setEditTarget(Catalog.services.find((item) => item.id === serviceId));
    showForm.on();
  };

  const applySaved = (previous: IServiceRow, saved: IBusinessServiceResource) => {
    BusinessServices.onUpsert(saved);
    if (isSuperadmin && saved.isActive !== previous.isActive) {
      Catalog.onActiveCountChange(saved.id, saved.isActive ? 1 : -1);
    }
  };

  /*
    Activar siempre pasa por la modal de precios (con los guardados ya puestos, si los hay):
    recién al confirmar se activa. Desactivar es directo.
  */
  const handleToggleActive = async (service: IServiceRow, isActive: boolean) => {
    /* El switch no se apaga mientras guarda: un toque más no manda otro cambio. */
    if (togglingId) {
      return;
    }
    if (isActive) {
      setActivateTarget(service);
      showActivate.on();
      return;
    }
    setTogglingId(service.id);
    const saved = await UpdateBusinessService.handler(service.id, { isActive });
    setTogglingId(null);
    if (saved) {
      applySaved(service, saved);
    }
  };

  const handleSavePrice = async (service: IServiceRow, field: TPriceField, value: number | null) => {
    const payload = field === "purchasePrice" ? { purchasePrice: value } : { profilePrice: value };
    const saved = await UpdateBusinessService.handler(service.id, payload);
    if (saved) {
      BusinessServices.onUpsert(saved);
    }
    return saved !== null;
  };

  const buildActions = (service: IServiceRow): IRowAction[] =>
    isSuperadmin ? [{ icon: Pencil, label: "Editar", onClick: () => openEdit(service.id) }] : [];

  const handlers: IServiceListHandlers = {
    canManageBusiness,
    isSuperadmin,
    togglingId,
    buildActions,
    onToggleActive: handleToggleActive,
    onSavePrice: handleSavePrice,
  };

  const pagination = (
    <ListPagination
      currentPage={pager.currentPage}
      totalPages={pager.totalPages}
      onPageChange={pager.setPage}
      pageSize={pager.pageSize}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      onPageSizeChange={pager.changePageSize}
    />
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6">
      <PageHeader
        title="Servicios"
        subtitle={subtitle}
        isLoadingSubtitle={isLoading}
        action={
          isSuperadmin && (
            <Button type="button" onClick={openCreate}>
              <Plus />
              Crear
            </Button>
          )
        }
      />

      {hasNoBusinesses && (
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
          <Store className="size-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-foreground">
            Crea un negocio para activar servicios y poner precios.{" "}
            <Link to="/negocios" className="font-semibold text-primary">
              Ir a Negocios
            </Link>
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <StickyToolbar>
          <div className="lg:ml-auto lg:w-72">
            <SearchInput
              placeholder="Buscar servicio…"
              aria-label="Buscar servicio por nombre"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </StickyToolbar>
      )}

      {!isLoading && rows.length === 0 && (
        <EmptyState
          icon={Tv}
          title={isSuperadmin ? "Todavía no hay servicios" : "Todavía no hay servicios en el catálogo"}
          description={isSuperadmin ? undefined : "Pídeselo a quien te dio el acceso."}
          action={
            isSuperadmin && (
              <Button type="button" variant="link" onClick={openCreate}>
                Crear el primero
              </Button>
            )
          }
        />
      )}

      {!isLoading && rows.length > 0 && visible.length === 0 && (
        <EmptyState icon={Search} title={`Sin resultados para "${search.trim()}"`} />
      )}

      {(isLoading || visible.length > 0) && (
        <>
          <ResultsCounter
            from={pager.rangeStart}
            to={pager.rangeEnd}
            total={pager.totalItems}
            isLoading={isLoading}
            className="lg:text-right"
          />
          <ServiceTable
            services={pager.pagedItems}
            isLoading={isLoading}
            footer={hasContent ? pagination : undefined}
            {...handlers}
          />
          <ServiceMobileList services={pager.pagedItems} isLoading={isLoading} {...handlers} />
          {hasContent && (
            <div className="rounded-xl bg-card px-4 py-3 shadow-card md:hidden">{pagination}</div>
          )}
        </>
      )}

      <ActivateServiceModal
        open={showActivate.active}
        service={activateTarget}
        onActivated={(saved) => activateTarget && applySaved(activateTarget, saved)}
        onClose={showActivate.off}
      />

      {isSuperadmin && (
        <ServiceFormModal
          open={showForm.active}
          service={editTarget}
          onSaved={Catalog.onUpsert}
          onClose={showForm.off}
        />
      )}
    </div>
  );
}
