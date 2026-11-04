import { IconButton } from "@yiya/ui/components/icon-button";
import type { ICustomerResource } from "@yiya/shared/customers";
import { Plus, UserRound, X } from "lucide-react";
import { type KeyboardEvent, useId, useState } from "react";

import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import SearchInput from "@/common/components/search-input";
import { looksLikePhone, matchesCustomerSearch } from "@/modules/customers/utils/customer-search";

import CustomerFormModal, { type ICustomerInitialValues } from "./customer-form-modal";
import CustomerWhatsAppValue from "./customer-whatsapp-value";

/* Más resultados no ayudan: si no está entre los primeros, se escribe más. */
const MAX_RESULTS = 6;

interface ICustomerSearchProps {
  /** Para que un `<Label htmlFor>` apunte al buscador. */
  id?: string;
  customers: ICustomerResource[];
  /** El elegido; `null` muestra el buscador. */
  value: ICustomerResource | null;
  isInvalid?: boolean;
  onChange: (customer: ICustomerResource | null) => void;
  /** Uno creado desde acá: la lista de clientes se entera. */
  onCreated: (customer: ICustomerResource) => void;
}

/**
 * El cliente del alquiler, como el de las órdenes de id-pos (`SearchClientMulti`,
 * acordado 2026-11-04): se escribe nombre, número o usuario y aparecen los que coinciden;
 * arriba, «Crear «…»» abre **la modal de cliente** con lo escrito (el nombre, o el número si
 * es un número). Elegido, se ve su card con ✕ para cambiarlo.
 *
 * Filtra la lista ya cargada, sin debounce: es instantáneo. Cuando un negocio tenga cientos
 * de clientes, se pasa a buscar en el server con debounce, como id-pos.
 */
export default function CustomerSearch({
  id,
  customers,
  value,
  isInvalid,
  onChange,
  onCreated,
}: ICustomerSearchProps) {
  const listId = useId();
  const [term, setTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [createValues, setCreateValues] = useState<ICustomerInitialValues | null>(null);

  if (value) {
    return (
      /* Tono de marca y sin sombra: se distingue de las cards de producto del catálogo. */
      <div className="flex items-center gap-3 rounded-lg bg-primary/8 px-3 py-2 ring-1 ring-primary/20">
        <InitialsAvatar name={value.name} color={avatarColorOf(value.name)} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading font-bold text-foreground">{value.name}</p>
          <CustomerWhatsAppValue customer={value} />
        </div>
        <IconButton label="Cambiar de cliente" onClick={() => onChange(null)}>
          <X />
        </IconButton>
      </div>
    );
  }

  const normalizedTerm = term.trim().toLowerCase();
  const results = normalizedTerm
    ? customers.filter((customer) => matchesCustomerSearch(customer, normalizedTerm)).slice(0, MAX_RESULTS)
    : [];
  const isListShown = isOpen && normalizedTerm.length > 0;

  const choose = (customer: ICustomerResource) => {
    onChange(customer);
    setTerm("");
    setIsOpen(false);
  };

  const openCreate = () => {
    const typed = term.trim();
    setCreateValues(looksLikePhone(typed) ? { phoneNumber: typed.replace(/\D/g, "") } : { name: typed });
    setIsOpen(false);
  };

  /* Enter elige el primero; si no hay ninguno, abre crear. */
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && normalizedTerm) {
      event.preventDefault();
      const [first] = results;
      if (first) {
        choose(first);
      } else {
        openCreate();
      }
    }
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="relative">
        <SearchInput
          id={id}
          icon={UserRound}
          isCompact
          placeholder="Busca cliente por nombre o número"
          aria-label="Buscar cliente por nombre, número o usuario"
          aria-expanded={isListShown}
          aria-controls={listId}
          aria-invalid={isInvalid}
          autoComplete="off"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          /* Cerrar después del clic en un resultado, no antes. */
          onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={handleKeyDown}
        />

        {isListShown && (
          <ul
            id={listId}
            role="listbox"
            className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl bg-popover p-1.5 shadow-elevated"
          >
            <li role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={openCreate}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left font-semibold text-primary transition-colors hover:bg-muted"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Plus className="size-5" />
                </span>
                <span className="truncate">Crear «{term.trim()}»</span>
              </button>
            </li>
            {results.map((customer) => (
              <li key={customer.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(customer)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <InitialsAvatar name={customer.name} color={avatarColorOf(customer.name)} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-foreground">{customer.name}</span>
                    {customer.phone && (
                      <span className="block truncate text-muted-foreground tabular-nums">
                        +{customer.phone.countryPrefix} {customer.phone.number}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
            {results.length === 0 && (
              <li className="px-3 py-2.5 text-muted-foreground">Ningún cliente con «{term.trim()}»</li>
            )}
          </ul>
        )}
      </div>

      <CustomerFormModal
        open={createValues !== null}
        initialValues={createValues ?? undefined}
        onSaved={(created) => {
          onCreated(created);
          choose(created);
        }}
        onClose={() => setCreateValues(null)}
      />
    </>
  );
}
