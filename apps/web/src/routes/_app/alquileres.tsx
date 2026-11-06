import { Button } from "@yiya/ui/components/button";
import { IconButton } from "@yiya/ui/components/icon-button";
import { cn } from "@yiya/ui/lib/utils";
import type { IRentalCustomer, IRentalResource } from "@yiya/shared/rentals";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Eye, Plus, RefreshCw, Search } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import EmptyState from "@/common/components/empty-state";
import FloatingActionButton from "@/common/components/floating-action-button";
import ListPagination, { ResultsCounter } from "@/common/components/list-pagination";
import type { IRowAction } from "@/common/components/row-actions";
import SearchInput from "@/common/components/search-input";
import StickyToolbar from "@/common/components/sticky-toolbar";
import { usePagination } from "@/common/hooks/use-pagination";
import { useListAccounts } from "@/modules/accounts/hooks/use-list-accounts";
import CustomerRentalsPanel from "@/modules/rentals/components/customer-rentals-panel";
import RentalFormModal from "@/modules/rentals/components/rental-form-modal";
import RentalRenewModal from "@/modules/rentals/components/rental-renew-modal";
import RentalMobileList from "@/modules/rentals/components/rental-mobile-list";
import RentalTable from "@/modules/rentals/components/rental-table";
import { useDeleteRental } from "@/modules/rentals/hooks/use-delete-rental";
import { useListRentals } from "@/modules/rentals/hooks/use-list-rentals";
import { useReleaseRental } from "@/modules/rentals/hooks/use-release-rental";
import { type ICustomerRentals, groupByCustomer } from "@/modules/rentals/utils/rental-groups";
import { useListBusinessServices } from "@/modules/services/hooks/use-list-business-services";

interface IRentalsSearch {
  /** El cliente abierto en el detalle: así se puede recargar o compartir el link. */
  cliente?: string;
}

export const Route = createFileRoute("/_app/alquileres")({
  validateSearch: (search: Record<string, unknown>): IRentalsSearch => ({
    cliente: typeof search.cliente === "string" ? search.cliente : undefined,
  }),
  component: RentalsPage,
});

const PAGE_SIZE_OPTIONS = [10, 20, 50];

/* Por cliente, servicio o correo de la cuenta. */
const matchesSearch = (group: ICustomerRentals, term: string): boolean =>
  group.customer.name.toLowerCase().includes(term) ||
  group.rentals.some(
    (rental) =>
      rental.service.name.toLowerCase().includes(term) || rental.account.email.toLowerCase().includes(term),
  );

/**
 * Alquileres: los clientes **activos**, una fila por cliente con lo que alquila, el que vence
 * primero arriba (acordado 2026-10-31). El que deja de alquilar se ve solo en Clientes. Ver
 * docs/planes/04b-alquileres.md.
 */
function RentalsPage() {
  const ListRentals = useListRentals();
  const ListServices = useListBusinessServices();
  const ListAccounts = useListAccounts();
  const DeleteRental = useDeleteRental();
  const ReleaseRental = useReleaseRental();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [editTarget, setEditTarget] = useState<IRentalResource | undefined>();
  const [renewTarget, setRenewTarget] = useState<IRentalResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IRentalResource | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<IRentalResource | null>(null);
  const [term, setTerm] = useState("");

  /* Servicios y cuentas los usa la modal de editar; se piden juntos al entrar. */
  useEffect(() => {
    const controller = new AbortController();
    ListRentals.handler(controller.signal);
    ListServices.handler(controller.signal);
    ListAccounts.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { rentals } = ListRentals;
  const isLoading = ListRentals.loading && rentals.length === 0;
  const groups = groupByCustomer(rentals);

  /* Se busca en la lista ya cargada: abrir un link con `?cliente=` no pide nada más. */
  const openGroup = groups.find((group) => group.customer.id === search.cliente) ?? null;

  const normalizedTerm = term.trim().toLowerCase();
  const visible = groups.filter((group) => !normalizedTerm || matchesSearch(group, normalizedTerm));
  const pager = usePagination(visible, { initialPageSize: PAGE_SIZE_OPTIONS[0] });
  const hasContent = !isLoading && visible.length > 0;

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTerm(event.target.value);
    pager.resetPage();
  };

  const openDetail = (group: ICustomerRentals) => navigate({ search: { cliente: group.customer.id } });
  const closeDetail = () => navigate({ search: {} });

  /* Alquilar va en su página, como el carrito de id-pos (2026-11-04). Con cliente, ya elegido. */
  const openCreate = (customer?: IRentalCustomer) =>
    navigate({ to: "/alquileres/nuevo", search: customer ? { cliente: customer.id } : {} });

  /* Sale de la lista; si era su único perfil, el cliente sale de Alquileres y el detalle se cierra. */
  const removeFromList = (rental: IRentalResource) => {
    ListRentals.onRemove(rental.id);
    const isLast = !rentals.some((item) => item.id !== rental.id && item.customer.id === rental.customer.id);
    if (isLast && search.cliente === rental.customer.id) {
      closeDetail();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    if (await DeleteRental.handler(deleteTarget)) {
      removeFromList(deleteTarget);
    }
    setDeleteTarget(null);
  };

  const confirmRelease = async () => {
    if (!releaseTarget) {
      return;
    }
    if (await ReleaseRental.handler(releaseTarget)) {
      removeFromList(releaseTarget);
    }
    setReleaseTarget(null);
  };

  const buildActions = (group: ICustomerRentals): IRowAction[] => [
    { icon: Plus, label: "Agregar perfil", onClick: () => openCreate(group.customer) },
    { icon: Eye, label: "Ver detalle", onClick: () => openDetail(group) },
  ];

  const searchInput = (
    <SearchInput
      isCompact
      placeholder="Buscar cliente o cuenta…"
      aria-label="Buscar por cliente, servicio o correo de la cuenta"
      value={term}
      onChange={handleSearchChange}
    />
  );

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
    /* Abajo, espacio para que el «+» flotante no tape la última card en celular. */
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 pt-2 pb-24 md:py-6">
      {/*
        Simple, como el reporte de ventas de id-pos (acordado 2026-11-04). Celular: solo el
        buscador, y crear es el «+» flotante. Escritorio: el título con recargar a la
        izquierda; el buscador y Alquilar a la derecha.
      */}
      <div className="hidden items-center justify-between gap-4 md:flex">
        <div className="flex min-w-0 items-center gap-1">
          <h1 className="font-heading text-xl font-bold text-foreground">Alquileres</h1>
          <IconButton label="Recargar alquileres" size="sm" onClick={() => !ListRentals.loading && ListRentals.handler()}>
            <RefreshCw className={cn(ListRentals.loading && "animate-spin motion-reduce:animate-none")} />
          </IconButton>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {groups.length > 0 && <div className="w-72">{searchInput}</div>}
          <Button type="button" onClick={() => openCreate()}>
            <Plus />
            Alquilar
          </Button>
        </div>
      </div>

      {groups.length > 0 && (
        <StickyToolbar className="md:hidden">{searchInput}</StickyToolbar>
      )}

      <FloatingActionButton label="Alquilar" icon={Plus} onClick={() => openCreate()} />

      {!isLoading && groups.length === 0 && (
        <EmptyState
          icon={CalendarClock}
          title="Todavía no tienes alquileres"
          description="Elige el cliente y los perfiles que lleva. Cada perfil vence por su lado."
          action={
            <Button type="button" variant="link" onClick={() => openCreate()}>
              Alquilar el primero
            </Button>
          }
        />
      )}

      {!isLoading && groups.length > 0 && visible.length === 0 && (
        <EmptyState icon={Search} title={`Sin resultados para "${term.trim()}"`} />
      )}

      {(isLoading || visible.length > 0) && (
        <>
          <ResultsCounter
            from={pager.rangeStart}
            to={pager.rangeEnd}
            total={pager.totalItems}
            isLoading={isLoading}
            className="hidden md:block lg:text-right"
          />
          <RentalTable
            groups={pager.pagedItems}
            isLoading={isLoading}
            buildActions={buildActions}
            onOpen={openDetail}
            footer={hasContent ? pagination : undefined}
          />
          {/*
            Celular sin «Mostrando» ni paginado (Thony, 2026-11-06): le quitaban espacio a
            las filas. La lista ya está cargada entera, así que se muestran todas.
          */}
          <RentalMobileList groups={visible} isLoading={isLoading} onOpen={openDetail} />
        </>
      )}

      {/* El panel lee de la lista: editar o agregar un perfil lo refresca solo. */}
      <CustomerRentalsPanel
        group={openGroup}
        onAdd={(group) => openCreate(group.customer)}
        onEdit={setEditTarget}
        onRenew={setRenewTarget}
        onRelease={setReleaseTarget}
        onDelete={setDeleteTarget}
        onClose={closeDetail}
      />

      {/* El anterior pasa al historial: sale de la lista y entra el nuevo, sin volver a pedirla. */}
      <RentalRenewModal
        rental={renewTarget}
        onRenewed={(previous, renewed) => {
          ListRentals.onRemove(previous.id);
          ListRentals.onUpsert([renewed]);
        }}
        onClose={() => setRenewTarget(null)}
      />

      <RentalFormModal
        rental={editTarget}
        services={ListServices.services}
        accounts={ListAccounts.accounts}
        rentals={rentals}
        onSaved={ListRentals.onUpsert}
        onClose={() => setEditTarget(undefined)}
      />

      {/* Liberar no borra: queda en el historial del cliente (RF-10). */}
      <ConfirmModal
        open={releaseTarget !== null}
        title={`¿Liberar ${releaseTarget?.service.name ?? ""} de ${releaseTarget?.customer.name ?? ""}?`}
        description={`${releaseTarget?.customer.name ?? ""} deja de tener el perfil ${releaseTarget?.profile.name ?? ""} de ${releaseTarget?.account.email ?? ""}. Sale de Alquileres y queda en su historial.`}
        confirmLabel="Liberar"
        loading={ReleaseRental.loading}
        onConfirm={confirmRelease}
        onCancel={() => setReleaseTarget(null)}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title={`¿Eliminar el alquiler de ${deleteTarget?.service.name ?? ""}?`}
        description={`Es para corregir uno mal cargado: se borra de ${deleteTarget?.customer.name ?? ""} sin dejar historial. Esto no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteRental.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
