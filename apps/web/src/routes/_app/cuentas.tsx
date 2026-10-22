import { Button } from "@yiya/ui/components/button";
import type { IAccountResource, IProfileResource } from "@yiya/shared/accounts";
import { Link, createFileRoute } from "@tanstack/react-router";
import { KeyRound, Pencil, Plus, Search, Trash2, Tv } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import ConfirmModal from "@/common/components/confirm-modal";
import EmptyState from "@/common/components/empty-state";
import ListPagination, { ResultsCounter } from "@/common/components/list-pagination";
import PageHeader from "@/common/components/page-header";
import type { IRowAction } from "@/common/components/row-actions";
import SearchInput from "@/common/components/search-input";
import FilterButton from "@/common/components/filter-button";
import type { IOption } from "@/common/components/select";
import StickyToolbar from "@/common/components/sticky-toolbar";
import { useBoolean } from "@/common/hooks/use-boolean";
import { usePagination } from "@/common/hooks/use-pagination";
import AccountDetailPanel from "@/modules/accounts/components/account-detail-panel";
import AccountFiltersModal, {
  EMPTY_ACCOUNT_FILTERS,
  type IAccountFilters,
  countAccountFilters,
} from "@/modules/accounts/components/account-filters-modal";
import AccountFormModal from "@/modules/accounts/components/account-form-modal";
import AccountMobileList from "@/modules/accounts/components/account-mobile-list";
import AccountTable from "@/modules/accounts/components/account-table";
import { useDeleteAccount } from "@/modules/accounts/hooks/use-delete-account";
import { useListAccounts } from "@/modules/accounts/hooks/use-list-accounts";
import { useAddProfile, useDeleteProfile } from "@/modules/accounts/hooks/use-profiles";
import { useUpdateAccount } from "@/modules/accounts/hooks/use-update-account";
import { useListProviders } from "@/modules/providers/hooks/use-list-providers";
import { useListBusinessServices } from "@/modules/services/hooks/use-list-business-services";
import { toServiceOption } from "@/modules/services/utils/service-option";

interface IAccountsSearch {
  /** La cuenta abierta en el detalle lateral: así se puede recargar o compartir el link. */
  cuenta?: string;
}

export const Route = createFileRoute("/_app/cuentas")({
  validateSearch: (search: Record<string, unknown>): IAccountsSearch => ({
    cuenta: typeof search.cuenta === "string" ? search.cuenta : undefined,
  }),
  component: AccountsPage,
});

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const NO_ACTIVE_SERVICES_MESSAGE = "Activa un servicio en Servicios para registrar cuentas.";

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

/* Activas primero; después por servicio y por correo. */
const byActiveServiceEmail = (a: IAccountResource, b: IAccountResource) =>
  Number(b.isActive) - Number(a.isActive) ||
  a.service.name.localeCompare(b.service.name, "es") ||
  a.email.localeCompare(b.email, "es");

interface IProfileTarget {
  account: IAccountResource;
  profile: IProfileResource;
}

/**
 * Cuentas del negocio en el que se está: el acceso (correo y contraseña) y sus perfiles.
 * Las compras y renovaciones todavía no están. Ver docs/planes/03-inventario.md.
 */
function AccountsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const ListAccounts = useListAccounts();
  const BusinessServices = useListBusinessServices();
  const ListProviders = useListProviders();
  const UpdateAccount = useUpdateAccount();
  const DeleteAccount = useDeleteAccount();
  const AddProfile = useAddProfile();
  const DeleteProfile = useDeleteProfile();
  const showForm = useBoolean();

  const [editTarget, setEditTarget] = useState<IAccountResource | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<IAccountResource | null>(null);
  const [profileTarget, setProfileTarget] = useState<IProfileTarget | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState<IAccountFilters>(EMPTY_ACCOUNT_FILTERS);
  const showFilters = useBoolean();

  useEffect(() => {
    const controller = new AbortController();
    ListAccounts.handler(controller.signal);
    BusinessServices.handler(controller.signal);
    ListProviders.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { accounts } = ListAccounts;
  const isLoading = ListAccounts.loading && accounts.length === 0;
  const activeCount = accounts.filter((item) => item.isActive).length;
  const hasActiveServices = BusinessServices.services.some((item) => item.isActive);
  const openAccount = accounts.find((item) => item.id === search.cuenta) ?? null;

  const normalizedTerm = term.trim().toLowerCase();
  const visible = accounts
    .filter(
      (item) =>
        (!normalizedTerm || item.email.toLowerCase().includes(normalizedTerm)) &&
        (!filters.serviceId || item.service.id === filters.serviceId) &&
        (!filters.providerId || item.provider.id === filters.providerId),
    )
    .sort(byActiveServiceEmail);
  const pager = usePagination(visible, { initialPageSize: PAGE_SIZE_OPTIONS[0] });
  const hasContent = !isLoading && visible.length > 0;
  const activeFilterCount = countAccountFilters(filters);
  const hasFilters = normalizedTerm !== "" || activeFilterCount > 0;

  /* Solo los servicios y proveedores que tienen cuentas: filtrar por otro da vacío siempre. */
  const serviceOptions: IOption[] = [
    ...new Map(accounts.map((item) => [item.service.id, item.service])).values(),
  ].map(toServiceOption);
  const providerOptions: IOption[] = [
    ...new Map(accounts.map((item) => [item.provider.id, item.provider.name])),
  ].map(([value, label]) => ({ value, label }));

  const resetPage = pager.resetPage;

  const handleFiltersChange = (next: IAccountFilters) => {
    setFilters(next);
    resetPage();
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTerm(event.target.value);
    resetPage();
  };

  const openDetail = (account: IAccountResource) => navigate({ search: { cuenta: account.id } });
  const closeDetail = () => navigate({ search: {} });

  /* El botón nunca se apaga: sin servicios activos, el clic dice qué falta. */
  const openCreate = () => {
    if (!hasActiveServices) {
      toast.error(NO_ACTIVE_SERVICES_MESSAGE);
      return;
    }
    setEditTarget(undefined);
    showForm.on();
  };

  const openEdit = (account: IAccountResource) => {
    setEditTarget(account);
    showForm.on();
  };

  /* Desactivar no borra nada: va directo, sin confirmación. */
  const handleToggleActive = async (account: IAccountResource) => {
    /* El switch no se apaga mientras guarda: un toque más no manda otro cambio. */
    if (togglingId) {
      return;
    }
    setTogglingId(account.id);
    const saved = await UpdateAccount.handler(account.id, { isActive: !account.isActive });
    setTogglingId(null);
    if (saved) {
      ListAccounts.onUpsert(saved);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const deleted = await DeleteAccount.handler(deleteTarget);
    if (deleted) {
      ListAccounts.onRemove(deleted.id);
      if (search.cuenta === deleted.id) {
        closeDetail();
      }
    }
    setDeleteTarget(null);
  };

  const handleAddProfile = async (account: IAccountResource) => {
    if (AddProfile.loading) {
      return;
    }
    const saved = await AddProfile.handler(account.id);
    if (saved) {
      ListAccounts.onUpsert(saved);
    }
  };

  const confirmDeleteProfile = async () => {
    if (!profileTarget) {
      return;
    }
    const deleted = await DeleteProfile.handler(profileTarget.profile);
    if (deleted) {
      ListAccounts.onProfileRemoved(profileTarget.account.id, deleted.id);
    }
    setProfileTarget(null);
  };

  const buildActions = (account: IAccountResource): IRowAction[] => [
    { icon: Pencil, label: "Editar", onClick: () => openEdit(account) },
    { icon: Trash2, label: "Eliminar", variant: "destructive", onClick: () => setDeleteTarget(account) },
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

  const listHandlers = {
    togglingId,
    buildActions,
    onToggleActive: handleToggleActive,
    onOpen: openDetail,
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6">
      <PageHeader
        title="Cuentas"
        subtitle={
          accounts.length > 0
            ? `${pluralize(accounts.length, "cuenta", "cuentas")} · ${pluralize(activeCount, "activa", "activas")}`
            : undefined
        }
        isLoadingSubtitle={isLoading}
        action={
          <Button type="button" onClick={openCreate}>
            <Plus />
            Registrar
          </Button>
        }
      />

      {!BusinessServices.loading && !hasActiveServices && (
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
          <Tv className="size-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-foreground">
            {NO_ACTIVE_SERVICES_MESSAGE}{" "}
            <Link to="/servicios" className="font-semibold text-primary">
              Ir a Servicios
            </Link>
          </p>
        </div>
      )}

      {accounts.length > 0 && (
        <StickyToolbar>
          {/* Los filtros no ocupan la pantalla: van en su modal, como en id-pos. */}
          <div className="flex gap-2 lg:ml-auto lg:w-96">
            <div className="min-w-0 flex-1">
              <SearchInput
                placeholder="Buscar por correo…"
                aria-label="Buscar cuenta por correo"
                value={term}
                onChange={handleSearchChange}
              />
            </div>
            <FilterButton activeCount={activeFilterCount} onClick={showFilters.on} />
          </div>
        </StickyToolbar>
      )}

      {!isLoading && accounts.length === 0 && (
        <EmptyState
          icon={KeyRound}
          title="Todavía no tienes cuentas"
          description="Registra cada cuenta de streaming con su correo y contraseña. Sus perfiles se crean solos."
          action={
            <Button type="button" variant="link" onClick={openCreate}>
              Registrar la primera
            </Button>
          }
        />
      )}

      {!isLoading && accounts.length > 0 && visible.length === 0 && (
        <EmptyState
          icon={Search}
          title={hasFilters ? "Ninguna cuenta con esos filtros" : "Sin resultados"}
        />
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
          <AccountTable
            accounts={pager.pagedItems}
            isLoading={isLoading}
            footer={hasContent ? pagination : undefined}
            {...listHandlers}
          />
          <AccountMobileList accounts={pager.pagedItems} isLoading={isLoading} {...listHandlers} />
          {hasContent && (
            <div className="rounded-xl bg-card px-4 py-3 shadow-card md:hidden">{pagination}</div>
          )}
        </>
      )}

      <AccountDetailPanel
        account={openAccount}
        isAddingProfile={AddProfile.loading}
        onToggleActive={handleToggleActive}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onAddProfile={handleAddProfile}
        onProfileSaved={(account, profile) => ListAccounts.onProfileSaved(account.id, profile)}
        onProfileDelete={(account, profile) => setProfileTarget({ account, profile })}
        onClose={closeDetail}
      />

      <AccountFiltersModal
        open={showFilters.active}
        filters={filters}
        serviceOptions={serviceOptions}
        providerOptions={providerOptions}
        resultCount={visible.length}
        onChange={handleFiltersChange}
        onClose={showFilters.off}
      />

      <AccountFormModal
        open={showForm.active}
        account={editTarget}
        services={BusinessServices.services}
        providers={ListProviders.providers}
        onProviderCreated={ListProviders.onUpsert}
        onSaved={ListAccounts.onUpsert}
        onClose={showForm.off}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title={`¿Eliminar la cuenta ${deleteTarget?.email ?? ""}?`}
        description="Se borran también sus perfiles. Esto no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteAccount.loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        open={profileTarget !== null}
        title={`¿Eliminar «${profileTarget?.profile.name ?? ""}»?`}
        description="La cuenta queda con un perfil menos. Esto no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        loading={DeleteProfile.loading}
        onConfirm={confirmDeleteProfile}
        onCancel={() => setProfileTarget(null)}
      />
    </div>
  );
}
