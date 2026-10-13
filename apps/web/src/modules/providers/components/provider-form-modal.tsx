import { Button } from "@yiya/ui/components/button";
import { Input } from "@yiya/ui/components/input";
import { Label } from "@yiya/ui/components/label";
import { Textarea } from "@yiya/ui/components/textarea";
import { DEFAULT_COUNTRY_PREFIX, type IPhone, phoneError } from "@yiya/shared/phones";
import {
  type IProviderResource,
  PROVIDER_NAME_MAX_LENGTH,
  PROVIDER_NAME_MIN_LENGTH,
  PROVIDER_NOTE_MAX_LENGTH,
} from "@yiya/shared/providers";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import Modal from "@/common/components/modal";
import PhoneInput from "@/common/components/phone-input";
import { useCreateProvider } from "@/modules/providers/hooks/use-create-provider";
import { useUpdateProvider } from "@/modules/providers/hooks/use-update-provider";

const FORM_ID = "provider-form";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(PROVIDER_NAME_MIN_LENGTH, "Escribe el nombre del proveedor")
    .max(PROVIDER_NAME_MAX_LENGTH, "El nombre es demasiado largo"),
  /* El número es opcional; si se escribe, tiene que servir para ese país. */
  phone: z
    .object({ countryPrefix: z.string(), number: z.string() })
    .superRefine((phone, context) => {
      const message = phone.number ? phoneError(phone.countryPrefix, phone.number) : null;
      if (message) {
        context.addIssue({ code: "custom", message });
      }
    }),
  note: z.string().max(PROVIDER_NOTE_MAX_LENGTH, "La nota es demasiado larga"),
});

const EMPTY_PHONE: IPhone = { countryPrefix: DEFAULT_COUNTRY_PREFIX, number: "" };

const buildDefaults = (provider?: IProviderResource) => ({
  name: provider?.name ?? "",
  phone: provider?.phone ?? EMPTY_PHONE,
  note: provider?.note ?? "",
});

interface IProviderFormModalProps {
  open: boolean;
  /** Sin proveedor: alta. Con proveedor: edición. */
  provider?: IProviderResource;
  onSaved: (provider: IProviderResource) => void;
  onClose: () => void;
}

/** Alta y edición de un proveedor del negocio: nombre, WhatsApp y una nota. */
export default function ProviderFormModal({ open, provider, onSaved, onClose }: IProviderFormModalProps) {
  const isEdit = Boolean(provider);
  const CreateProvider = useCreateProvider();
  const UpdateProvider = useUpdateProvider();

  const form = useForm({
    defaultValues: buildDefaults(provider),
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        name: value.name.trim(),
        phone: value.phone.number ? value.phone : null,
        note: value.note.trim() || null,
      };
      const saved = provider
        ? await UpdateProvider.handler(provider.id, payload)
        : await CreateProvider.handler(payload);

      if (saved) {
        onSaved(saved);
        onClose();
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(provider));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, provider]);

  return (
    <Modal
      open={open}
      title={isEdit ? "Editar proveedor" : "Nuevo proveedor"}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin motion-reduce:animate-none" />}
                {isEdit ? "Guardar cambios" : "Agregar proveedor"}
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
          form.handleSubmit();
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
                maxLength={PROVIDER_NAME_MAX_LENGTH}
                placeholder="Ej. Juan Pérez"
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
              <Label htmlFor={field.name}>WhatsApp (opcional)</Label>
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

        <form.Field name="note">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Nota (opcional)</Label>
              <Textarea
                id={field.name}
                name={field.name}
                rows={3}
                maxLength={PROVIDER_NOTE_MAX_LENGTH}
                placeholder="Ej. Vende Netflix y Max. Responde de noche."
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="min-h-24 rounded-xl border-2 bg-card px-4 py-3 text-lg font-medium focus-visible:ring-4 focus-visible:ring-ring/30 md:text-lg"
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
