import { Button } from "@yiya/ui/components/button";
import type { IProviderResource } from "@yiya/shared/providers";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2, Truck } from "lucide-react";
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
import ProviderFormModal from "@/modules/providers/components/provider-form-modal";
import ProviderMobileList from "@/modules/providers/components/provider-mobile-list";
import ProviderTable from "@/modules/providers/components/provider-table";
import { useDeleteProvider } from "@/modules/providers/hooks/use-delete-provider";
import { useListProviders } from "@/modules/providers/hooks/use-list-providers";

export const Route = createFileRoute("/_app/proveedores")({
  component: ProvidersPage,
});

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

/* Busca por nombre, por número (con o sin espacios) y en la nota. */
const matchesSearch = (provider: IProviderResource, term: string): boolean => {
  const digits = term.replace(/\D/g, "");
  const phone = provider.phone ? `${provider.phone.countryPrefix}${provider.phone.number}` : "";
  return (
    provider.name.toLowerCase().includes(term) ||
    (provider.note?.toLowerCase().includes(term) ?? false) ||
    (digits.length > 0 && phone.includes(digits))
  );
};

/**
 * Proveedores del negocio en el que se está: a quién le compra cuentas. Los ve y los maneja
 * el dueño, y el superadmin dentro del negocio elegido. Ver docs/planes/03-inventario.md.
 */
function ProvidersPage() {
  const ListProviders = useListProviders();
  const DeleteProvider = useDeleteProvider();
  const showForm = useBoolean();

  const [editTarget, setEditTarget] = useState<IProviderResource | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<IProviderResource | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    ListProviders.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { providers } = ListProviders;
  const isLoading = ListProviders.loading && providers.length === 0;

  const term = search.trim().toLowerCase();
  const visible = providers
    .filter((provider) => !term || matchesSearch(provider, term))
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

  const openEdit = (provider: IProviderResource) => {
    setEditTarget(provider);
    showForm.on();
  };

  /* Con cuentas no se puede: se avisa cuántas tiene en vez de pedir confirmación. */
  const isDeleteBlocked = (deleteTarget?.accountCount ?? 0) > 0;
  const blockedMessage = deleteTarget
    ? `Tiene ${deleteTarget.accountCount === 1 ? "1 cuenta" : `${deleteTarget.accountCount} cuentas`}. Cámbiales el proveedor o elimínalas primero.`
    : "";

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleteBlocked) {
      setDeleteTarget(null);
      return;
    }
    const deleted = await DeleteProvider.handler(deleteTarget);
    if (deleted) {
      ListProviders.onRemove(deleted.id);
    }
    setDeleteTarget(null);
  };

  const buildActions = (provider: IProviderResource): IRowAction[] => [
    { icon: Pencil, label: "Editar", onClick: () => openEdit(provider) },
    {
      icon: Trash2,
      label: "Eliminar",
      variant: "destructive",
      onClick: () => setDeleteTarget(provider),
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
        title="Proveedores"
        subtitle={providers.length > 0 ? pluralize(providers.length, "proveedor", "proveedores") : undefined}
        isLoadingSubtitle={isLoading}
        action={
          <Button type="button" onClick={openCreate}>
            <Plus />
            Agregar
          </Button>
        }
      />

      {providers.length > 0 && (
        <StickyToolbar>
          <div className="lg:ml-auto lg:w-72">
            <SearchInput
              placeholder="Buscar proveedor…"
              aria-label="Buscar proveedor por nombre, número o nota"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </StickyToolbar>
      )}

      {!isLoading && providers.length === 0 && (
        <EmptyState
          icon={Truck}
          title="Todavía no tienes proveedores"
          description="Son a quienes les compras las cuentas. Uno puede venderte varios servicios."
          action={
            <Button type="button" variant="link" onClick={openCreate}>
              Agregar el primero
            </Button>
          }
        />
      )}

      {!isLoading && providers.length > 0 && visible.length === 0 && (
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
          <ProviderTable
            providers={pager.pagedItems}
            isLoading={isLoading}
            buildActions={buildActions}
            footer={hasContent ? pagination : undefined}
          />
          <ProviderMobileList
            providers={pager.pagedItems}
            isLoading={isLoading}
            buildActions={buildActions}
          />
          {hasContent && (
            <div className="rounded-xl bg-card px-4 py-3 shadow-card md:hidden">{pagination}</div>
          )}
        </>
      )}

      <ProviderFormModal
        open={showForm.active}
        provider={editTarget}
        onSaved={ListProviders.onUpsert}
        onClose={showForm.off}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title={
          isDeleteBlocked
            ? `No puedes eliminar a «${deleteTarget?.name ?? ""}»`
            : `¿Eliminar a «${deleteTarget?.name ?? ""}»?`
        }
        description={
          isDeleteBlocked ? blockedMessage : "Se borra de tu lista de proveedores. Esto no se puede deshacer."
        }
        confirmLabel={isDeleteBlocked ? "Entendido" : "Eliminar"}
        variant={isDeleteBlocked ? "default" : "destructive"}
        hideCancel={isDeleteBlocked}
        loading={DeleteProvider.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
