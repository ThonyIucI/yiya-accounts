import { Button } from "@yiya/ui/components/button";
import { Input } from "@yiya/ui/components/input";
import { Label } from "@yiya/ui/components/label";
import {
  type ICatalogServiceResource,
  SERVICE_IMAGE_URL_MAX_LENGTH,
  SERVICE_MIN_PROFILES,
  SERVICE_NAME_MAX_LENGTH,
  SERVICE_NAME_MIN_LENGTH,
} from "@yiya/shared/services";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import Modal from "@/common/components/modal";
import { useCreateService } from "@/modules/services/hooks/use-create-service";
import { useUpdateService } from "@/modules/services/hooks/use-update-service";

import ServiceAvatar from "./service-avatar";

const FORM_ID = "service-form";
const PROFILES_PATTERN = /^\d+$/;

const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(SERVICE_NAME_MIN_LENGTH, "Ingresa el nombre del servicio")
    .max(SERVICE_NAME_MAX_LENGTH, "El nombre es demasiado largo"),
  profilesPerAccount: z
    .string()
    .trim()
    .refine(
      (value) => PROFILES_PATTERN.test(value) && Number(value) >= SERVICE_MIN_PROFILES,
      "Escribe un número entero desde 1",
    ),
  imageUrl: z
    .string()
    .trim()
    .max(SERVICE_IMAGE_URL_MAX_LENGTH, "El link es demasiado largo")
    .refine((value) => value === "" || isHttpsUrl(value), "El link debe empezar con https://"),
});

const buildDefaults = (service?: ICatalogServiceResource) => ({
  name: service?.name ?? "",
  profilesPerAccount: service ? String(service.profilesPerAccount) : "",
  imageUrl: service?.imageUrl ?? "",
});

interface IServiceFormModalProps {
  open: boolean;
  /** Sin servicio: alta. Con servicio: edición. */
  service?: ICatalogServiceResource;
  onSaved: (service: ICatalogServiceResource) => void;
  onClose: () => void;
}

/**
 * Alta y edición de un servicio del catálogo global (solo el superadmin). Crearlo no lo
 * activa en ningún negocio: cada negocio lo activa y le pone sus precios en su lista.
 */
export default function ServiceFormModal({ open, service, onSaved, onClose }: IServiceFormModalProps) {
  const isEdit = Boolean(service);
  const CreateService = useCreateService();
  const UpdateService = useUpdateService();

  const form = useForm({
    defaultValues: buildDefaults(service),
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        name: value.name.trim(),
        profilesPerAccount: Number(value.profilesPerAccount.trim()),
        imageUrl: value.imageUrl.trim() || null,
      };
      const saved = service
        ? await UpdateService.handler(service.id, payload)
        : await CreateService.handler(payload);

      if (saved) {
        onSaved(saved);
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
      title={isEdit ? "Editar servicio" : "Nuevo servicio"}
      description={
        isEdit
          ? "Los cambios se ven en todos los negocios."
          : "Queda en el catálogo. Cada negocio lo activa y le pone sus precios."
      }
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
                {isEdit ? "Guardar cambios" : "Crear servicio"}
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
                maxLength={SERVICE_NAME_MAX_LENGTH}
                placeholder="Ej. Netflix"
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="profilesPerAccount">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Perfiles por cuenta</Label>
              <Input
                id={field.name}
                name={field.name}
                inputMode="numeric"
                autoComplete="off"
                placeholder="Ej. 5"
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="imageUrl">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Link de la imagen (opcional)</Label>
              <div className="flex items-center gap-3">
                {/* Vista previa: si el link no carga, se ve la inicial, igual que en la lista. */}
                <form.Subscribe selector={(state) => state.values.name}>
                  {(name) => (
                    <ServiceAvatar
                      name={name || "?"}
                      imageUrl={field.state.value.trim() || null}
                      className="size-13"
                    />
                  )}
                </form.Subscribe>
                <Input
                  id={field.name}
                  name={field.name}
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  maxLength={SERVICE_IMAGE_URL_MAX_LENGTH}
                  placeholder="https://…/netflix.png"
                  aria-invalid={field.state.meta.errors.length > 0}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </div>
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
