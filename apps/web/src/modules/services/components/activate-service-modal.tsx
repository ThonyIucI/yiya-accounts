import { Button } from "@yiya/ui/components/button";
import { Label } from "@yiya/ui/components/label";
import { INVALID_SOLES_MESSAGE, parseSoles, toSolesInput } from "@yiya/shared/money";
import type { IBusinessServiceResource } from "@yiya/shared/services";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import Modal from "@/common/components/modal";
import { useUpdateBusinessService } from "@/modules/services/hooks/use-update-business-service";
import { PRICE_LABELS, type IServiceRow, type TPriceField } from "@/modules/services/service-row";

import ServiceProfit from "./service-profit";
import SolesInput from "./soles-input";

const FORM_ID = "activate-service-form";

const priceSchema = z.string().refine((value) => parseSoles(value) !== null, INVALID_SOLES_MESSAGE);
const formSchema = z.object({ purchasePrice: priceSchema, profilePrice: priceSchema });

const PRICE_HELP: Record<TPriceField, string> = {
  purchasePrice: "Lo que te cuesta una cuenta.",
  profilePrice: "A cuánto alquilas un perfil por un mes.",
};

const buildDefaults = (service: IServiceRow | null) => ({
  purchasePrice: toSolesInput(service?.purchasePrice ?? null),
  profilePrice: toSolesInput(service?.profilePrice ?? null),
});

interface IActivateServiceModalProps {
  open: boolean;
  /** El servicio que se quiso activar sin precios. Se conserva al cerrar, para la salida. */
  service: IServiceRow | null;
  onActivated: (saved: IBusinessServiceResource) => void;
  onClose: () => void;
}

/**
 * Se abre cada vez que se activa un servicio, con los precios guardados ya puestos (si los
 * hay). Recién al confirmar se guardan los precios **y** se activa, en un solo paso. Con el
 * servicio activo, los precios se siguen cambiando directo en la card o en la fila.
 */
export default function ActivateServiceModal({
  open,
  service,
  onActivated,
  onClose,
}: IActivateServiceModalProps) {
  const UpdateBusinessService = useUpdateBusinessService();

  const form = useForm({
    defaultValues: buildDefaults(service),
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      if (!service) {
        return;
      }
      const saved = await UpdateBusinessService.handler(service.id, {
        purchasePrice: parseSoles(value.purchasePrice),
        profilePrice: parseSoles(value.profilePrice),
        isActive: true,
      });
      if (saved) {
        onActivated(saved);
        onClose();
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(service));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service]);

  return (
    <Modal
      open={open}
      title={`Activar «${service?.name ?? ""}»`}
      description="Confirma sus dos precios. Mientras esté activo, los cambias directo en la lista."
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={FORM_ID}>
                {isSubmitting && <Loader2 className="animate-spin motion-reduce:animate-none" />}
                Activar
              </Button>
            )}
          </form.Subscribe>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          /* El botón nunca se apaga: un segundo clic mientras guarda no hace nada. */
          if (!form.state.isSubmitting) {
            form.handleSubmit();
          }
        }}
        className="space-y-4"
      >
        {(["purchasePrice", "profilePrice"] as const).map((name) => (
          <form.Field key={name} name={name}>
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{PRICE_LABELS[name]}</Label>
                <SolesInput
                  id={field.name}
                  name={field.name}
                  aria-invalid={field.state.meta.errors.length > 0}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <p className="text-sm text-muted-foreground">{PRICE_HELP[name]}</p>
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        ))}

        {/* Lo que deja una cuenta llena, en vivo mientras se escriben los precios. */}
        {service && (
          <form.Subscribe selector={(state) => state.values}>
            {(values) => (
              <ServiceProfit
                className="rounded-xl bg-muted/60 px-4 py-3 text-sm"
                service={{
                  profilesPerAccount: service.profilesPerAccount,
                  purchasePrice: parseSoles(values.purchasePrice),
                  profilePrice: parseSoles(values.profilePrice),
                }}
              />
            )}
          </form.Subscribe>
        )}
      </form>
    </Modal>
  );
}
