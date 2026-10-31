import { Button } from "@yiya/ui/components/button";
import type { ICustomerResource } from "@yiya/shared/customers";
import { createFileRoute } from "@tanstack/react-router";
import { Contact, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import CustomerFormModal from "@/modules/customers/components/customer-form-modal";
import CustomerMobileList from "@/modules/customers/components/customer-mobile-list";
import CustomerTable from "@/modules/customers/components/customer-table";
import { useDeleteCustomer } from "@/modules/customers/hooks/use-delete-customer";
import { useListCustomers } from "@/modules/customers/hooks/use-list-customers";

export const Route = createFileRoute("/_app/clientes")({
  component: CustomersPage,
});

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

/* Busca por nombre, por número (con o sin espacios), por usuario (con o sin «@») y en la nota. */
const matchesSearch = (customer: ICustomerResource, term: string): boolean => {
  const digits = term.replace(/\D/g, "");
  const username = term.replace(/^@/, "");
  const phone = customer.phone ? `${customer.phone.countryPrefix}${customer.phone.number}` : "";
  return (
    customer.name.toLowerCase().includes(term) ||
    (customer.note?.toLowerCase().includes(term) ?? false) ||
    (username.length > 0 && (customer.whatsappUsername?.toLowerCase().includes(username) ?? false)) ||
    (digits.length > 0 && phone.includes(digits))
  );
};

/**
 * Clientes del negocio en el que se está: a quién le alquila perfiles. Los ve y los maneja
 * el dueño, y el superadmin dentro del negocio elegido. Ver docs/planes/04a-clientes.md.
 */
function CustomersPage() {
  const ListCustomers = useListCustomers();
  const DeleteCustomer = useDeleteCustomer();
  const showForm = useBoolean();

  const [editTarget, setEditTarget] = useState<ICustomerResource | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ICustomerResource | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    ListCustomers.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { customers } = ListCustomers;
  const isLoading = ListCustomers.loading && customers.length === 0;

  const term = search.trim().toLowerCase();
  const visible = customers
    .filter((customer) => !term || matchesSearch(customer, term))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  const pager = usePagination(visible, { initialPageSize: PAGE_SIZE_OPTIONS[0] });
  const hasContent = !isLoading && visible.length > 0;

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    pager.resetPage();
  };

  const openCreate = () => {
    setEditTarget(undefined);
    showForm.on();
  };

  const openEdit = (customer: ICustomerResource) => {
    setEditTarget(customer);
    showForm.on();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const deleted = await DeleteCustomer.handler(deleteTarget);
    if (deleted) {
      ListCustomers.onRemove(deleted.id);
    }
    setDeleteTarget(null);
  };

  const buildActions = (customer: ICustomerResource): IRowAction[] => [
    { icon: Pencil, label: "Editar", onClick: () => openEdit(customer) },
    {
      icon: Trash2,
      label: "Eliminar",
      variant: "destructive",
      onClick: () => setDeleteTarget(customer),
    },
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
        title="Clientes"
        subtitle={customers.length > 0 ? pluralize(customers.length, "cliente", "clientes") : undefined}
        isLoadingSubtitle={isLoading}
        action={
          <Button type="button" onClick={openCreate}>
            <Plus />
            Agregar
          </Button>
        }
      />

      {customers.length > 0 && (
        <StickyToolbar>
          <div className="lg:ml-auto lg:w-72">
            <SearchInput
              placeholder="Buscar cliente…"
              aria-label="Buscar cliente por nombre, número, usuario o nota"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </StickyToolbar>
      )}

      {!isLoading && customers.length === 0 && (
        <EmptyState
          icon={Contact}
          title="Todavía no tienes clientes"
          description="Son a quienes les alquilas los perfiles. Guarda su WhatsApp para escribirles rápido."
          action={
            <Button type="button" variant="link" onClick={openCreate}>
              Agregar el primero
            </Button>
          }
        />
      )}

      {!isLoading && customers.length > 0 && visible.length === 0 && (
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
          <CustomerTable
            customers={pager.pagedItems}
            isLoading={isLoading}
            buildActions={buildActions}
            footer={hasContent ? pagination : undefined}
          />
          <CustomerMobileList
            customers={pager.pagedItems}
            isLoading={isLoading}
            buildActions={buildActions}
          />
          {hasContent && (
            <div className="rounded-xl bg-card px-4 py-3 shadow-card md:hidden">{pagination}</div>
          )}
        </>
      )}

      <CustomerFormModal
        open={showForm.active}
        customer={editTarget}
        onSaved={ListCustomers.onUpsert}
        onClose={showForm.off}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title={`¿Eliminar a «${deleteTarget?.name ?? ""}»?`}
        description="Se borra de tu lista de clientes. Esto no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteCustomer.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
