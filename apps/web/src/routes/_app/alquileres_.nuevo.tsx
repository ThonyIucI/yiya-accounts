import { Button } from "@yiya/ui/components/button";
import { iconButtonVariants } from "@yiya/ui/components/icon-button";
import type { ICustomerResource } from "@yiya/shared/customers";
import { formatSoles, parseSoles } from "@yiya/shared/money";
import { RENTAL_MAX_ITEMS } from "@yiya/shared/rentals";
import { Link, createFileRoute } from "@tanstack/react-router";
import { KeyRound, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import EmptyState from "@/common/components/empty-state";
import FieldError from "@/common/components/field-error";
import Modal from "@/common/components/modal";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { useListAccounts } from "@/modules/accounts/hooks/use-list-accounts";
import CustomerSearch from "@/modules/customers/components/customer-search";
import { useListCustomers } from "@/modules/customers/hooks/use-list-customers";
import RentableAccountCard from "@/modules/rentals/components/rentable-account-card";
import { RentalCartCheckout, RentalCartLines } from "@/modules/rentals/components/rental-cart";
import { useCreateRentals } from "@/modules/rentals/hooks/use-create-rentals";
import { useListRentals } from "@/modules/rentals/hooks/use-list-rentals";
import { useRentalCart } from "@/modules/rentals/hooks/use-rental-cart";
import { profileHoldersOf } from "@/modules/rentals/utils/profile-options";
import { buildLine, nextProfileOf } from "@/modules/rentals/utils/rental-cart";
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

/**
 * Alquilar, como crear una orden en id-pos (acordado 2026-11-04). **Sin encabezado ni
 * título**: todo el alto es para el carrito, y el ✕ de arriba sale a Alquileres.
 *
 * - Izquierda, sobre fondo gris (para que se vea la sombra de las cards): el servicio como
 *   logos con scroll y sus cuentas como cards de producto; tocar una agrega un perfil.
 * - Derecha, a todo el alto: el cliente arriba, el carrito en el medio (scrollea) y el cobro
 *   fijo abajo, con **un solo total**.
 * - Celular: una columna; el carrito se abre desde la barra de abajo, en una hoja.
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
  const [isCartOpen, setIsCartOpen] = useState(false);

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
  const total = parseSoles(cart.totalInput);

  /* `?cliente=` desde «Agregar perfil»: se elige apenas llega la lista. */
  useEffect(() => {
    if (search.cliente && !customer) {
      setCustomer(customers.find((item) => item.id === search.cliente) ?? null);
    }
  }, [search.cliente, customers, customer]);

  const handleAdd = (accountId: string) => {
    const account = accountsById.get(accountId);
    if (!account) {
      return;
    }
    const profileId = nextProfileOf(account, cart.lines, holders);
    if (!profileId) {
      toast.error("Ya agregaste todos los perfiles de esta cuenta.");
      return;
    }
    if (!cart.addLine(buildLine(account.id, profileId))) {
      toast.error(`Puedes alquilar hasta ${RENTAL_MAX_ITEMS} perfiles de una vez.`);
      return;
    }
    const sharedWith = holders.get(profileId) ?? [];
    if (sharedWith.length > 0) {
      toast.info(`No quedan libres: lo compartes con ${sharedWith.join(", ")}.`);
    }
  };

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
    <div className="space-y-1">
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
    </div>
  );

  const cartLines = <RentalCartLines cart={cart} accountsById={accountsById} holders={holders} />;
  const checkout = <RentalCartCheckout cart={cart} isSubmitting={CreateRentals.loading} onSubmit={handleSubmit} />;

  return (
    <div className="min-h-svh bg-muted lg:grid lg:h-svh lg:grid-cols-[minmax(0,1fr)_26rem]">
      <section aria-label="Cuentas" className="min-w-0 space-y-4 px-4 pt-4 pb-28 lg:overflow-y-auto lg:pb-6">
        <div className="flex items-center gap-2">
          <Link to="/alquileres" aria-label="Salir a Alquileres" className={iconButtonVariants({ size: "md" })}>
            <X />
          </Link>
          {rentableServices.length > 0 && (
            <div className="min-w-0 flex-1">
              <ServicePicker services={rentableServices} value={currentServiceId} onChange={setServiceId} />
            </div>
          )}
        </div>

        {!isDesktop && customerField}

        {!isLoading && rentableServices.length === 0 && (
          <EmptyState
            icon={KeyRound}
            title="No tienes cuentas para alquilar"
            description="Registra una cuenta activa en Cuentas, de un servicio que trabajes."
          />
        )}

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {serviceAccounts.map((account) => (
            <li key={account.id}>
              <RentableAccountCard
                account={account}
                profilePrice={priceOf(account.service.id)}
                freeCount={account.profiles.filter((profile) => !holders.has(profile.id)).length}
                inCartCount={cart.lines.filter((line) => line.accountId === account.id).length}
                onAdd={() => handleAdd(account.id)}
              />
            </li>
          ))}
        </ul>
      </section>

      {isDesktop && (
        <aside aria-label="Carrito" className="flex h-svh flex-col bg-card shadow-card">
          <div className="px-4 pt-4 pb-3 shadow-edge-bottom">{customerField}</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{cartLines}</div>
          <div className="px-4 pt-3 pb-4 shadow-edge-top">{checkout}</div>
        </aside>
      )}

      {/* Celular: la barra del carrito tapa la de navegación mientras se arma el alquiler. */}
      {!isDesktop && cart.lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-card px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-edge-top">
          <Button type="button" size="lg" className="w-full justify-between" onClick={() => setIsCartOpen(true)}>
            <span className="flex items-center gap-2">
              <ShoppingBag />
              {cart.lines.length === 1 ? "1 perfil" : `${cart.lines.length} perfiles`}
            </span>
            <span className="tabular-nums">{total === null ? "Ver carrito" : formatSoles(total)}</span>
          </Button>
        </div>
      )}

      {!isDesktop && (
        <Modal open={isCartOpen} title="Carrito" footer={checkout} onClose={() => setIsCartOpen(false)}>
          {cartLines}
        </Modal>
      )}
    </div>
  );
}
