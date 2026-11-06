import { Button } from "@yiya/ui/components/button";
import { formatSoles, parseSoles } from "@yiya/shared/money";
import { IconButton } from "@yiya/ui/components/icon-button";
import type { ICustomerResource } from "@yiya/shared/customers";
import { RENTAL_MAX_ITEMS } from "@yiya/shared/rentals";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import EmptyState from "@/common/components/empty-state";
import FieldError from "@/common/components/field-error";
import { FormSection, FormSections } from "@/common/components/form-section";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { useListAccounts } from "@/modules/accounts/hooks/use-list-accounts";
import CustomerSearch from "@/modules/customers/components/customer-search";
import { useListCustomers } from "@/modules/customers/hooks/use-list-customers";
import RentableAccountCard from "@/modules/rentals/components/rentable-account-card";
import {
  RentalCartActions,
  RentalCartLines,
  RentalCartPayment,
} from "@/modules/rentals/components/rental-cart";
import RentalItemModal from "@/modules/rentals/components/rental-item-modal";
import { useCreateRentals } from "@/modules/rentals/hooks/use-create-rentals";
import { useListRentals } from "@/modules/rentals/hooks/use-list-rentals";
import { useRentalCart } from "@/modules/rentals/hooks/use-rental-cart";
import { profileHoldersOf } from "@/modules/rentals/utils/profile-options";
import { type ICartLine, buildLine, nextProfileOf } from "@/modules/rentals/utils/rental-cart";
import ServicePicker from "@/modules/services/components/service-picker";
import { useListBusinessServices } from "@/modules/services/hooks/use-list-business-services";

interface INewRentalSearch {
  /** Al agregar un perfil desde un cliente, ya viene elegido (RF-04). */
  cliente?: string;
}

export const Route = createFileRoute("/_app/alquileres_/nuevo")({
  validateSearch: (search: Record<string, unknown>): INewRentalSearch => ({
    cliente: typeof search.cliente === "string" ? search.cliente : undefined,
  }),
  component: NewRentalPage,
});

/* El mismo corte que `lg:`: desde ahí el carrito va en su columna. */
const DESKTOP_QUERY = "(min-width: 1024px)";
const CUSTOMER_MESSAGE = "Elige el cliente o crea uno nuevo.";
/* Celular: el pie fijo tapa la barra de navegación mientras se arma el alquiler. */
const MOBILE_FOOTER_CLASS =
  "fixed inset-x-0 bottom-0 z-40 bg-card px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-edge-top";

/** El detalle abierto: una cuenta del catálogo, o una línea del carrito para cambiarla. */
interface IOpenItem {
  accountId: string;
  lineKey?: string;
}

/**
 * Alquilar, como crear una orden en id-pos (acordado 2026-11-04). **Sin encabezado, título
 * ni ✕ de salir**: todo el alto es para el carrito; se sale con la navegación.
 *
 * - Escritorio: a la izquierda, sobre gris, los servicios como chips y sus cuentas como cards
 *   de producto. A la derecha, el cliente, el carrito y el cobro (scrollean) y el pie fijo
 *   con **solo** Cancelar y Alquilar.
 * - Celular, como id-pos (acordado 2026-11-04), dos vistas:
 *   1. **El formulario**: cliente, los perfiles ya agregados (o «Elegir perfiles» si está
 *      vacío) y el cobro; al pie, Cancelar y Alquilar.
 *   2. **El catálogo**: los servicios y sus cuentas; al pie, «Agregar», que vuelve al
 *      formulario.
 */
function NewRentalPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const ListCustomers = useListCustomers();
  const ListServices = useListBusinessServices();
  const ListAccounts = useListAccounts();
  const ListRentals = useListRentals();
  const CreateRentals = useCreateRentals();

  const [customer, setCustomer] = useState<ICustomerResource | null>(null);
  const [customerError, setCustomerError] = useState<string | undefined>();
  const [serviceId, setServiceId] = useState("");
  /** Celular: el catálogo abierto, y cuántas líneas había al abrirlo (para contar las nuevas). */
  const [browseFromCount, setBrowseFromCount] = useState<number | null>(null);
  const isBrowsing = !isDesktop && browseFromCount !== null;
  const [openItem, setOpenItem] = useState<IOpenItem | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    ListCustomers.handler(controller.signal);
    ListServices.handler(controller.signal);
    ListAccounts.handler(controller.signal);
    ListRentals.handler(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { customers } = ListCustomers;
  const accounts = ListAccounts.accounts.filter((account) => account.isActive);
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const services = ListServices.services.filter((service) => service.isActive);
  const holders = profileHoldersOf(ListRentals.rentals);

  const serviceOf = (accountId: string) => accountsById.get(accountId)?.service.id ?? "";
  const priceOf = (id: string) => services.find((service) => service.id === id)?.profilePrice ?? null;
  const cart = useRentalCart(serviceOf, priceOf);

  /* Solo los servicios con cuentas para alquilar; el primero queda elegido. */
  const rentableServices = services.filter((service) => accounts.some((account) => account.service.id === service.id));
  const currentServiceId = serviceId || rentableServices[0]?.id || "";
  const serviceAccounts = accounts.filter((account) => account.service.id === currentServiceId);
  const isLoading = ListAccounts.loading && ListAccounts.accounts.length === 0;

  /* `?cliente=` desde «Agregar perfil»: se elige apenas llega la lista. */
  useEffect(() => {
    if (search.cliente && !customer) {
      setCustomer(customers.find((item) => item.id === search.cliente) ?? null);
    }
  }, [search.cliente, customers, customer]);

  const addLines = (added: ICartLine[]): boolean => {
    if (!cart.addLines(added)) {
      toast.error(`Puedes alquilar hasta ${RENTAL_MAX_ITEMS} perfiles de una vez.`);
      return false;
    }
    return true;
  };

  /* El «+» de la card: el siguiente perfil libre por un mes, sin abrir el detalle. */
  const handleQuickAdd = (accountId: string) => {
    const account = accountsById.get(accountId);
    if (!account) {
      return;
    }
    const profileId = nextProfileOf(account, cart.lines, holders);
    if (!profileId) {
      toast.error("Ya agregaste todos los perfiles de esta cuenta.");
      return;
    }
    if (!addLines([buildLine(account.id, profileId)])) {
      return;
    }
    const sharedWith = holders.get(profileId) ?? [];
    if (sharedWith.length > 0) {
      toast.info(`No quedan libres: lo compartes con ${sharedWith.join(", ")}.`);
    }
  };

  const openLine = (lineKey: string) => {
    const line = cart.lines.find((item) => item.key === lineKey);
    if (line) {
      setOpenItem({ accountId: line.accountId, lineKey });
    }
  };

  const openBrowse = () => {
    setBrowseFromCount(cart.lines.length);
    window.scrollTo({ top: 0 });
  };

  const closeBrowse = () => {
    setBrowseFromCount(null);
    window.scrollTo({ top: 0 });
  };

  const addedCount = browseFromCount === null ? 0 : Math.max(cart.lines.length - browseFromCount, 0);
  /* Lo que suman los perfiles agregados en esta vuelta (las líneas nuevas van al final). */
  const addedAmount =
    addedCount === 0 ? 0 : cart.lineAmounts.slice(-addedCount).reduce((sum, amount) => sum + amount, 0);

  /* «Agregar» nunca se apaga: sin perfiles nuevos, el clic dice qué hacer. */
  const handleBrowseDone = () => {
    if (addedCount === 0) {
      toast.error("Toca una cuenta para agregar un perfil.");
      return;
    }
    closeBrowse();
  };

  const openAccount = openItem ? (accountsById.get(openItem.accountId) ?? null) : null;
  const openLineValue = openItem?.lineKey ? cart.lines.find((line) => line.key === openItem.lineKey) : undefined;

  const handleSubmit = async () => {
    /* El botón nunca se apaga: si falta algo, el clic lo dice; mientras guarda, no repite. */
    if (CreateRentals.loading) {
      return;
    }
    const items = cart.validate();
    setCustomerError(customer ? undefined : CUSTOMER_MESSAGE);
    if (!customer) {
      toast.error(CUSTOMER_MESSAGE);
      return;
    }
    if (!items) {
      return;
    }
    const created = await CreateRentals.handler({ customerId: customer.id, items });
    if (created) {
      navigate({ to: "/alquileres", search: { cliente: customer.id } });
    }
  };

  const customerField = (
    <FormSection icon={UserRound} title="Cliente" className="space-y-2">
      <CustomerSearch
        customers={customers}
        value={customer}
        isInvalid={Boolean(customerError)}
        onChange={(next) => {
          setCustomer(next);
          setCustomerError(undefined);
        }}
        onCreated={ListCustomers.onUpsert}
      />
      <FieldError errors={customerError ? [{ message: customerError }] : []} />
    </FormSection>
  );

  const cartLines = (
    <RentalCartLines
      cart={cart}
      accountsById={accountsById}
      holders={holders}
      onOpenLine={openLine}
      onBrowse={isDesktop ? undefined : openBrowse}
    />
  );
  /* El cobro va en el cuerpo, y solo con algo en el carrito: sin perfiles no hay qué cobrar. */
  const payment = cart.lines.length > 0 && <RentalCartPayment cart={cart} />;
  const actions = (
    <RentalCartActions
      isSubmitting={CreateRentals.loading}
      total={cart.lines.length > 0 ? parseSoles(cart.totalInput) : null}
      onCancel={() => navigate({ to: "/alquileres" })}
      onSubmit={handleSubmit}
    />
  );

  /*
    El catálogo va hundido: la sombra la proyecta la barra de servicios de arriba, no las
    cards, que flotan sobre el fondo `canvas` (Thony, 2026-11-06).
  */
  const catalog = (
    <div className="flex-1 space-y-3 bg-canvas px-4 pt-4 pb-28 lg:pb-6">
      {!isLoading && rentableServices.length === 0 && (
        <EmptyState
          icon={KeyRound}
          title="No tienes cuentas para alquilar"
          description="Registra una cuenta activa en Cuentas, de un servicio que trabajes."
        />
      )}

      {/* Ancho mínimo por card: con poco espacio baja una columna, no se achata. */}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-3">
        {serviceAccounts.map((account) => (
          <li key={account.id}>
            <RentableAccountCard
              account={account}
              profilePrice={priceOf(account.service.id)}
              freeCount={account.profiles.filter((profile) => !holders.has(profile.id)).length}
              inCartCount={cart.lines.filter((line) => line.accountId === account.id).length}
              onOpen={() => setOpenItem({ accountId: account.id })}
              onAdd={() => handleQuickAdd(account.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );

  const servicePicker = rentableServices.length > 0 && (
    <ServicePicker services={rentableServices} value={currentServiceId} onChange={setServiceId} />
  );

  const itemModal = (
    <RentalItemModal
      account={openAccount}
      line={openLineValue}
      lines={cart.lines}
      holders={holders}
      profilePrice={openAccount ? priceOf(openAccount.service.id) : null}
      onAdd={addLines}
      onSave={cart.changeLine}
      onClose={() => setOpenItem(null)}
    />
  );

  if (isDesktop) {
    return (
      <div className="grid h-svh grid-cols-[minmax(0,1fr)_26rem]">
        <section aria-label="Cuentas" className="flex min-w-0 flex-col overflow-y-auto">
          <div className="sticky top-0 z-10 bg-card px-4 py-3 shadow-edge-bottom">{servicePicker}</div>
          {catalog}
        </section>

        {/* El borde va de arriba abajo: sin él, las franjas grises parecían cortar el carrito. */}
        <aside aria-label="Carrito" className="flex h-svh flex-col border-l border-border bg-card">
          {/* Secciones separadas por el gris, como el carrito de id-pos (2026-11-04). */}
          <FormSections className="min-h-0 flex-1 overflow-y-auto">
            {customerField}
            {cartLines}
            {payment}
          </FormSections>
          <div className="px-4 pt-3 pb-4 shadow-edge-top">{actions}</div>
        </aside>
        {itemModal}
      </div>
    );
  }

  /* Celular, vista 2: el catálogo. El pie tapa la navegación mientras se elige. */
  if (isBrowsing) {
    return (
      <div className="flex min-h-svh flex-col">
        <div className="sticky top-0 z-10 flex items-center gap-2 bg-card px-4 py-3 shadow-edge-bottom">
          <IconButton label="Volver al alquiler" className="-ml-1.5" onClick={closeBrowse}>
            <ArrowLeft />
          </IconButton>
          <div className="min-w-0 flex-1">{servicePicker}</div>
        </div>
        {catalog}
        <div className={MOBILE_FOOTER_CLASS}>
          <Button type="button" size="lg" className="w-full justify-between" onClick={handleBrowseDone}>
            <span>Agregar</span>
            {addedCount > 0 && (
              <span className="tabular-nums">
                {addedCount === 1 ? "1 perfil" : `${addedCount} perfiles`}
                {addedAmount > 0 && ` · ${formatSoles(addedAmount)}`}
              </span>
            )}
          </Button>
        </div>
        {itemModal}
      </div>
    );
  }

  /* Celular, vista 1: el formulario, con todo lo del alquiler. */
  return (
    <FormSections className="min-h-svh pb-28">
      {customerField}
      {cartLines}
      {payment}
      <div className={MOBILE_FOOTER_CLASS}>{actions}</div>
      {itemModal}
    </FormSections>
  );
}
