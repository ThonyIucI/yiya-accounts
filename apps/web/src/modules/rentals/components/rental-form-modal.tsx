import { Button } from "@yiya/ui/components/button";
import type { IAccountResource } from "@yiya/shared/accounts";
import type { IRentalResource } from "@yiya/shared/rentals";
import type { IBusinessServiceResource } from "@yiya/shared/services";
import { Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import Modal from "@/common/components/modal";
import type { IOption } from "@/common/components/select";
import { useUpdateRental } from "@/modules/rentals/hooks/use-update-rental";
import { profileHoldersOf } from "@/modules/rentals/utils/profile-options";
import {
  type IRentalItemValues,
  type TRentalItemErrors,
  toItemPayload,
  toItemValues,
  validateItemValues,
} from "@/modules/rentals/utils/rental-form";
import { toServiceOption } from "@/modules/services/utils/service-option";

import RentalItemFields from "./rental-item-fields";

const FORM_ID = "rental-form";

interface IRentalFormModalProps {
  /** El alquiler que se edita; `undefined` cierra la modal. */
  rental?: IRentalResource;
  services: IBusinessServiceResource[];
  accounts: IAccountResource[];
  /** Los abiertos: para decir con quién está cada perfil (RF-06). */
  rentals: IRentalResource[];
  onSaved: (rentals: IRentalResource[]) => void;
  onClose: () => void;
}

/**
 * Editar **un** perfil alquilado: el perfil, su parte del precio, lo pagado y las fechas.
 * Alquilar va en su página, como el carrito de id-pos (`/alquileres/nuevo`, 2026-11-04).
 */
export default function RentalFormModal({
  rental,
  services,
  accounts,
  rentals,
  onSaved,
  onClose,
}: IRentalFormModalProps) {
  const UpdateRental = useUpdateRental();
  const [values, setValues] = useState<IRentalItemValues | null>(null);
  const [errors, setErrors] = useState<TRentalItemErrors | undefined>();

  const serviceOptions: IOption[] = services.filter((item) => item.isActive).map(toServiceOption);
  const holders = profileHoldersOf(rentals, rental?.id);

  useEffect(() => {
    if (rental) {
      setValues(toItemValues(rental));
      setErrors(undefined);
    }
  }, [rental]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    /* El botón nunca se apaga: mientras guarda, un segundo clic no hace nada. */
    if (!rental || !values || UpdateRental.loading) {
      return;
    }
    const nextErrors = validateItemValues(values);
    setErrors(nextErrors);
    if (nextErrors) {
      return;
    }
    const saved = await UpdateRental.handler(rental.id, toItemPayload(values));
    if (saved) {
      onSaved([saved]);
      onClose();
    }
  };

  return (
    <Modal
      open={rental !== undefined}
      title="Editar alquiler"
      description={rental?.customer.name}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID}>
            {UpdateRental.loading && <Loader2 className="animate-spin motion-reduce:animate-none" />}
            Guardar cambios
          </Button>
        </>
      }
    >
      {values && (
        <form id={FORM_ID} onSubmit={handleSubmit}>
          <RentalItemFields
            idPrefix="rental-edit"
            value={values}
            errors={errors}
            serviceOptions={serviceOptions}
            services={services}
            accounts={accounts}
            holders={holders}
            onChange={setValues}
          />
        </form>
      )}
    </Modal>
  );
}
