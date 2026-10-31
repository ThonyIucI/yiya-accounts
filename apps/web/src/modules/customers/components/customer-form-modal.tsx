import { Button } from "@yiya/ui/components/button";
import { Input } from "@yiya/ui/components/input";
import { Label } from "@yiya/ui/components/label";
import { Textarea } from "@yiya/ui/components/textarea";
import {
  CUSTOMER_NAME_LENGTH_MESSAGE,
  CUSTOMER_NAME_MAX_LENGTH,
  CUSTOMER_NAME_MIN_LENGTH,
  CUSTOMER_NOTE_LENGTH_MESSAGE,
  CUSTOMER_NOTE_MAX_LENGTH,
  type ICustomerResource,
} from "@yiya/shared/customers";
import { DEFAULT_COUNTRY_PREFIX, type IPhone, phoneError } from "@yiya/shared/phones";
import {
  WHATSAPP_USERNAME_INVALID_MESSAGE,
  WHATSAPP_USERNAME_MAX_LENGTH,
  isValidWhatsAppUsername,
  toWhatsAppUsername,
} from "@yiya/shared/whatsapp";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import Modal from "@/common/components/modal";
import PhoneInput from "@/common/components/phone-input";
import { useCreateCustomer } from "@/modules/customers/hooks/use-create-customer";
import { useUpdateCustomer } from "@/modules/customers/hooks/use-update-customer";

const FORM_ID = "customer-form";

/* La «@» del principio no cuenta para el largo: se guarda sin ella. */
const USERNAME_INPUT_MAX_LENGTH = WHATSAPP_USERNAME_MAX_LENGTH + 1;

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(CUSTOMER_NAME_MIN_LENGTH, CUSTOMER_NAME_LENGTH_MESSAGE)
    .max(CUSTOMER_NAME_MAX_LENGTH, CUSTOMER_NAME_LENGTH_MESSAGE),
  /* El número es opcional; si se escribe, tiene que servir para ese país. */
  phone: z
    .object({ countryPrefix: z.string(), number: z.string() })
    .superRefine((phone, context) => {
      const message = phone.number ? phoneError(phone.countryPrefix, phone.number) : null;
      if (message) {
        context.addIssue({ code: "custom", message });
      }
    }),
  /* Opcional, con o sin «@». */
  whatsappUsername: z.string().refine((value) => {
    const username = toWhatsAppUsername(value);
    return username === "" || isValidWhatsAppUsername(username);
  }, WHATSAPP_USERNAME_INVALID_MESSAGE),
  note: z.string().max(CUSTOMER_NOTE_MAX_LENGTH, CUSTOMER_NOTE_LENGTH_MESSAGE),
});

const EMPTY_PHONE: IPhone = { countryPrefix: DEFAULT_COUNTRY_PREFIX, number: "" };

const buildDefaults = (customer?: ICustomerResource) => ({
  name: customer?.name ?? "",
  phone: customer?.phone ?? EMPTY_PHONE,
  whatsappUsername: customer?.whatsappUsername ?? "",
  note: customer?.note ?? "",
});

interface ICustomerFormModalProps {
  open: boolean;
  /** Sin cliente: alta. Con cliente: edición. */
  customer?: ICustomerResource;
  onSaved: (customer: ICustomerResource) => void;
  onClose: () => void;
}

/** Alta y edición de un cliente: nombre, número y usuario de WhatsApp, y una nota. */
export default function CustomerFormModal({ open, customer, onSaved, onClose }: ICustomerFormModalProps) {
  const isEdit = Boolean(customer);
  const CreateCustomer = useCreateCustomer();
  const UpdateCustomer = useUpdateCustomer();

  const form = useForm({
    defaultValues: buildDefaults(customer),
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        name: value.name.trim(),
        phone: value.phone.number ? value.phone : null,
        whatsappUsername: toWhatsAppUsername(value.whatsappUsername) || null,
        note: value.note.trim() || null,
      };
      const saved = customer
        ? await UpdateCustomer.handler(customer.id, payload)
        : await CreateCustomer.handler(payload);

      if (saved) {
        onSaved(saved);
        onClose();
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(customer));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer]);

  return (
    <Modal
      open={open}
      title={isEdit ? "Editar cliente" : "Nuevo cliente"}
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
                {isEdit ? "Guardar cambios" : "Agregar cliente"}
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
        <form.Field name="name">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Nombre</Label>
              <Input
                id={field.name}
                name={field.name}
                autoCapitalize="words"
                maxLength={CUSTOMER_NAME_MAX_LENGTH}
                placeholder="Ej. Ana Pérez"
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="phone">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Número de WhatsApp (opcional)</Label>
              <PhoneInput
                id={field.name}
                value={field.state.value}
                isInvalid={field.state.meta.errors.length > 0}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="whatsappUsername">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Usuario de WhatsApp (opcional)</Label>
              <Input
                id={field.name}
                name={field.name}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={USERNAME_INPUT_MAX_LENGTH}
                placeholder="Ej. @ana.pe"
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="note">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Nota (opcional)</Label>
              <Textarea
                id={field.name}
                name={field.name}
                rows={3}
                maxLength={CUSTOMER_NOTE_MAX_LENGTH}
                placeholder="Ej. Paga a fin de mes."
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="min-h-24 rounded-xl border-2 bg-card px-4 py-3 text-base font-medium focus-visible:ring-4 focus-visible:ring-ring/30 md:text-base"
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
