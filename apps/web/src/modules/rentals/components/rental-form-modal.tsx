import { Button } from "@yiya/ui/components/button";
import { Label } from "@yiya/ui/components/label";
import type { IAccountResource } from "@yiya/shared/accounts";
import type { ICustomerResource } from "@yiya/shared/customers";
import { formatSoles } from "@yiya/shared/money";
import { type IRentalCustomer, type IRentalResource, RENTAL_MAX_ITEMS } from "@yiya/shared/rentals";
import type { IBusinessServiceResource } from "@yiya/shared/services";
import { Loader2, Plus } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import FieldError from "@/common/components/field-error";
import Modal from "@/common/components/modal";
import { CreatableSelect, type IOption } from "@/common/components/select";
import { useCreateCustomer } from "@/modules/customers/hooks/use-create-customer";
import { useCreateRentals } from "@/modules/rentals/hooks/use-create-rentals";
import { useUpdateRental } from "@/modules/rentals/hooks/use-update-rental";
import { profileHoldersOf } from "@/modules/rentals/utils/profile-options";
import {
  type IRentalItemValues,
  type TRentalItemErrors,
  buildItemValues,
  toItemPayload,
  toItemValues,
  totalOf,
  validateItemValues,
} from "@/modules/rentals/utils/rental-form";
import { toServiceOption } from "@/modules/services/utils/service-option";

import RentalItemFields from "./rental-item-fields";

const FORM_ID = "rental-form";
const CUSTOMER_MESSAGE = "Elige el cliente o crea uno nuevo";

interface IRentalFormModalProps {
  open: boolean;
  /** Con alquiler: se edita ese perfil. Sin alquiler: se alquilan uno o varios. */
  rental?: IRentalResource;
  /** Al agregar un perfil desde el detalle de un cliente, ya viene elegido (RF-04). */
  presetCustomer?: IRentalCustomer;
  customers: ICustomerResource[];
  services: IBusinessServiceResource[];
  accounts: IAccountResource[];
  /** Los abiertos: para decir con quién está cada perfil (RF-06). */
  rentals: IRentalResource[];
  /** Un cliente creado desde acá («Crear «…»»): la lista de clientes se entera. */
  onCustomerCreated: (customer: ICustomerResource) => void;
  onSaved: (rentals: IRentalResource[]) => void;
  onClose: () => void;
}

/**
 * Alquilar, como armar una venta de id-pos: el cliente (buscar o crear sin salir, RF-07) y
 * uno o varios perfiles, cada uno con su precio, lo pagado y sus fechas. Al editar, un solo
 * perfil y el cliente fijo.
 *
 * Con `useState` y no TanStack Form: la lista de perfiles crece y se achica, y cada fila
 * valida con `validateItemValues` (las mismas reglas del server).
 */
export default function RentalFormModal({
  open,
  rental,
  presetCustomer,
  customers,
  services,
  accounts,
  rentals,
  onCustomerCreated,
  onSaved,
  onClose,
}: IRentalFormModalProps) {
  const isEdit = Boolean(rental);
  const CreateRentals = useCreateRentals();
  const UpdateRental = useUpdateRental();
  const CreateCustomer = useCreateCustomer();

  const [customerId, setCustomerId] = useState("");
  const [customerError, setCustomerError] = useState<string | undefined>();
  const [items, setItems] = useState<IRentalItemValues[]>([]);
  const [itemErrors, setItemErrors] = useState<Record<string, TRentalItemErrors>>({});

  const isSubmitting = CreateRentals.loading || UpdateRental.loading;
  const serviceOptions: IOption[] = services.filter((item) => item.isActive).map(toServiceOption);
  const customerOptions: IOption[] = customers.map((item) => ({ value: item.id, label: item.name }));
  const holders = profileHoldersOf(rentals, rental?.id);

  useEffect(() => {
    if (!open) {
      return;
    }
    setCustomerId(rental?.customer.id ?? presetCustomer?.id ?? "");
    setCustomerError(undefined);
    setItems([rental ? toItemValues(rental) : buildItemValues()]);
    setItemErrors({});
  }, [open, rental, presetCustomer]);

  const changeItem = (next: IRentalItemValues) =>
    setItems((previous) => previous.map((item) => (item.key === next.key ? next : item)));

  const removeItem = (key: string) => setItems((previous) => previous.filter((item) => item.key !== key));

  /* El siguiente perfil arranca con el servicio del anterior: lo común es llevar dos iguales. */
  const addItem = () => {
    if (items.length >= RENTAL_MAX_ITEMS) {
      toast.error(`Puedes alquilar hasta ${RENTAL_MAX_ITEMS} perfiles de una vez.`);
      return;
    }
    const last = items.at(-1);
    const service = services.find((item) => item.id === last?.serviceId);
    setItems((previous) => [...previous, buildItemValues(service?.id, service?.profilePrice ?? null)]);
  };

  const handleCreateCustomer = async (name: string) => {
    const created = await CreateCustomer.handler({
      name: name.trim(),
      phone: null,
      whatsappUsername: null,
      note: null,
    });
    if (created) {
      onCustomerCreated(created);
      setCustomerId(created.id);
      setCustomerError(undefined);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    /* El botón nunca se apaga: si falta algo, el clic lo dice; mientras guarda, no repite. */
    if (isSubmitting) {
      return;
    }
    const nextErrors = Object.fromEntries(
      items.flatMap((item) => {
        const errors = validateItemValues(item);
        return errors ? [[item.key, errors]] : [];
      }),
    );
    const nextCustomerError = customerId ? undefined : CUSTOMER_MESSAGE;
    setItemErrors(nextErrors);
    setCustomerError(nextCustomerError);
    if (nextCustomerError || Object.keys(nextErrors).length > 0) {
      return;
    }

    const saved = rental
      ? await UpdateRental.handler(rental.id, toItemPayload(items[0]!)).then((item) => item && [item])
      : await CreateRentals.handler({ customerId, items: items.map(toItemPayload) });
    if (saved) {
      onSaved(saved);
      onClose();
    }
  };

  const fixedCustomer = rental?.customer ?? presetCustomer;

  return (
    <Modal
      open={open}
      title={isEdit ? "Editar alquiler" : "Alquilar"}
      description={fixedCustomer ? fixedCustomer.name : undefined}
      width="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID}>
            {isSubmitting && <Loader2 className="animate-spin motion-reduce:animate-none" />}
            {isEdit ? "Guardar cambios" : "Alquilar"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        {!fixedCustomer && (
          <div className="space-y-2">
            <Label htmlFor="rental-customer">Cliente</Label>
            <CreatableSelect
              inputId="rental-customer"
              placeholder="Busca o escribe uno nuevo"
              options={customerOptions}
              isLoading={CreateCustomer.loading}
              isInvalid={Boolean(customerError)}
              value={customerOptions.find((option) => option.value === customerId) ?? null}
              onChange={(option) => {
                if (option) {
                  setCustomerId(option.value);
                  setCustomerError(undefined);
                }
              }}
              onCreateOption={handleCreateCustomer}
            />
            <FieldError errors={customerError ? [{ message: customerError }] : []} />
          </div>
        )}

        {items.map((item, index) => (
          <RentalItemFields
            key={item.key}
            idPrefix={`rental-item-${index}`}
            value={item}
            errors={itemErrors[item.key]}
            serviceOptions={serviceOptions}
            services={services}
            accounts={accounts}
            holders={holders}
            onRemove={!isEdit && items.length > 1 ? () => removeItem(item.key) : undefined}
            onChange={changeItem}
          />
        ))}

        {!isEdit && (
          <>
            <Button type="button" variant="outline" className="w-full" onClick={addItem}>
              <Plus />
              Agregar otro perfil
            </Button>
            {/* En el cuerpo y no en el pie: en celular los botones del pie se reparten el ancho. */}
            <p className="flex items-center justify-between font-heading font-bold text-foreground">
              Total
              <span className="tabular-nums">{formatSoles(totalOf(items))}</span>
            </p>
          </>
        )}
      </form>
    </Modal>
  );
}
