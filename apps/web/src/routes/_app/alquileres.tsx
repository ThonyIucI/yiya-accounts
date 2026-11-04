import { Button } from "@yiya/ui/components/button";
import type { IRentalCustomer, IRentalResource } from "@yiya/shared/rentals";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Eye, Plus, Search } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";

import ConfirmModal from "@/common/components/confirm-modal";
import EmptyState from "@/common/components/empty-state";
import ListPagination, { ResultsCounter } from "@/common/components/list-pagination";
import PageHeader from "@/common/components/page-header";
import type { IRowAction } from "@/common/components/row-actions";
import SearchInput from "@/common/components/search-input";
import StickyToolbar from "@/common/components/sticky-toolbar";
import { useBoolean } from "@/common/hooks/use-boolean";
import { usePagination } from "@/common/hooks/use-pagination";
import { useListAccounts } from "@/modules/accounts/hooks/use-list-accounts";
import { useListCustomers } from "@/modules/customers/hooks/use-list-customers";
import CustomerRentalsPanel from "@/modules/rentals/components/customer-rentals-panel";
import RentalFormModal from "@/modules/rentals/components/rental-form-modal";
import RentalMobileList from "@/modules/rentals/components/rental-mobile-list";
import RentalTable from "@/modules/rentals/components/rental-table";
import { useDeleteRental } from "@/modules/rentals/hooks/use-delete-rental";
import { useListRentals } from "@/modules/rentals/hooks/use-list-rentals";
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

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

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
  const ListCustomers = useListCustomers();
  const ListServices = useListBusinessServices();
  const ListAccounts = useListAccounts();
  const DeleteRental = useDeleteRental();
  const showForm = useBoolean();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [editTarget, setEditTarget] = useState<IRentalResource | undefined>();
  const [presetCustomer, setPresetCustomer] = useState<IRentalCustomer | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<IRentalResource | null>(null);
  const [term, setTerm] = useState("");

  /* Clientes, servicios y cuentas los usa la modal de alquilar; se piden juntos al entrar. */
  useEffect(() => {
    const controller = new AbortController();
    ListRentals.handler(controller.signal);
    ListCustomers.handler(controller.signal);
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

  const openCreate = (customer?: IRentalCustomer) => {
    setEditTarget(undefined);
    setPresetCustomer(customer);
    showForm.on();
  };

  const openEdit = (rental: IRentalResource) => {
    setEditTarget(rental);
    setPresetCustomer(undefined);
    showForm.on();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const deleted = await DeleteRental.handler(deleteTarget);
    if (deleted) {
      ListRentals.onRemove(deleted.id);
      /* Era su único perfil: el cliente sale de Alquileres y el detalle se cierra. */
      const isLast = !rentals.some(
        (item) => item.id !== deleted.id && item.customer.id === deleteTarget.customer.id,
      );
      if (isLast && search.cliente === deleteTarget.customer.id) {
        closeDetail();
      }
    }
    setDeleteTarget(null);
  };

  const buildActions = (group: ICustomerRentals): IRowAction[] => [
    { icon: Plus, label: "Agregar perfil", onClick: () => openCreate(group.customer) },
    { icon: Eye, label: "Ver detalle", onClick: () => openDetail(group) },
  ];

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
        title="Alquileres"
        subtitle={groups.length > 0 ? pluralize(groups.length, "cliente activo", "clientes activos") : undefined}
        isLoadingSubtitle={isLoading}
        action={
          <Button type="button" onClick={() => openCreate()}>
            <Plus />
            Alquilar
          </Button>
        }
      />

      {groups.length > 0 && (
        <StickyToolbar>
          <div className="lg:ml-auto lg:w-72">
            <SearchInput
              placeholder="Buscar cliente o cuenta…"
              aria-label="Buscar por cliente, servicio o correo de la cuenta"
              value={term}
              onChange={handleSearchChange}
            />
          </div>
        </StickyToolbar>
      )}

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
            className="lg:text-right"
          />
          <RentalTable
            groups={pager.pagedItems}
            isLoading={isLoading}
            buildActions={buildActions}
            onOpen={openDetail}
            footer={hasContent ? pagination : undefined}
          />
          <RentalMobileList groups={pager.pagedItems} isLoading={isLoading} onOpen={openDetail} />
          {hasContent && <div className="pt-2 md:hidden">{pagination}</div>}
        </>
      )}

      {/* El panel lee de la lista: editar o agregar un perfil lo refresca solo. */}
      <CustomerRentalsPanel
        group={openGroup}
        onAdd={(group) => openCreate(group.customer)}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onClose={closeDetail}
      />

      <RentalFormModal
        open={showForm.active}
        rental={editTarget}
        presetCustomer={presetCustomer}
        customers={ListCustomers.customers}
        services={ListServices.services}
        accounts={ListAccounts.accounts}
        rentals={rentals}
        onCustomerCreated={ListCustomers.onUpsert}
        onSaved={ListRentals.onUpsert}
        onClose={showForm.off}
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
