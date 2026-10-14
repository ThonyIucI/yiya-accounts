import { Button } from "@yiya/ui/components/button";
import { Input } from "@yiya/ui/components/input";
import { Label } from "@yiya/ui/components/label";
import {
  BUSINESS_NAME_MAX_LENGTH,
  BUSINESS_NAME_MIN_LENGTH,
  type IBusinessResource,
} from "@yiya/shared/businesses";
import type { IUserResource } from "@yiya/shared/users";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import Modal from "@/common/components/modal";
import Select, { type IOption } from "@/common/components/select";
import { useCreateBusiness } from "@/modules/businesses/hooks/use-create-business";
import { useUpdateBusiness } from "@/modules/businesses/hooks/use-update-business";

const FORM_ID = "business-form";

const nameSchema = z
  .string()
  .trim()
  .min(BUSINESS_NAME_MIN_LENGTH, "Ingresa el nombre del negocio")
  .max(BUSINESS_NAME_MAX_LENGTH, "El nombre es demasiado largo");

/* El dueño se valida en su propio campo: solo existe al crear. */
const formSchema = z.object({ name: nameSchema, ownerId: z.string() });
const OWNER_REQUIRED_MESSAGE = "Elige al dueño";
const NO_OWNERS_MESSAGE = "No hay usuarios libres. Crea primero el usuario del dueño en «Usuarios».";

const buildDefaults = (business?: IBusinessResource) => ({
  name: business?.name ?? "",
  ownerId: business?.owner?.id ?? "",
});

interface IBusinessFormModalProps {
  open: boolean;
  /** Sin negocio: alta. Con negocio: edición (por ahora solo el nombre). */
  business?: IBusinessResource;
  /** Usuarios que pueden ser dueños: rol USER y sin negocio. */
  availableOwners: IUserResource[];
  onSaved: (business: IBusinessResource) => void;
  onClose: () => void;
}

/**
 * Alta y edición de un negocio. Al crearlo se elige su dueño entre los usuarios que todavía
 * no tienen negocio: si el cliente no tiene usuario, primero se crea en «Usuarios».
 */
export default function BusinessFormModal({
  open,
  business,
  availableOwners,
  onSaved,
  onClose,
}: IBusinessFormModalProps) {
  const isEdit = Boolean(business);
  const CreateBusiness = useCreateBusiness();
  const UpdateBusiness = useUpdateBusiness();

  const form = useForm({
    defaultValues: buildDefaults(business),
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      const name = value.name.trim();
      const saved = business
        ? await UpdateBusiness.handler(business.id, { name })
        : await CreateBusiness.handler({ name, ownerId: value.ownerId });

      if (saved) {
        onSaved(saved);
        onClose();
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(business));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, business]);

  const hasNoOwners = !isEdit && availableOwners.length === 0;
  const ownerOptions: IOption[] = availableOwners.map((owner) => ({
    value: owner.id,
    label: owner.name,
    description: owner.email,
  }));

  return (
    <Modal
      open={open}
      title={isEdit ? "Editar negocio" : "Nuevo negocio"}
      description={isEdit ? undefined : "Su dueño podrá entrar y administrar solo este negocio."}
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
                {isEdit ? "Guardar cambios" : "Crear negocio"}
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
              <Label htmlFor={field.name}>Nombre del negocio</Label>
              <Input
                id={field.name}
                name={field.name}
                autoCapitalize="words"
                maxLength={BUSINESS_NAME_MAX_LENGTH}
                placeholder="Ej. Streaming Ana"
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        {isEdit ? (
          <div className="space-y-1 rounded-xl bg-muted px-4 py-3">
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Dueño</p>
            <p className="text-base font-semibold text-foreground">
              {business?.owner ? `${business.owner.name} · ${business.owner.email}` : "Sin dueño"}
            </p>
          </div>
        ) : (
          <form.Field
            name="ownerId"
            validators={{
              onSubmit: ({ value }) => {
                if (hasNoOwners) {
                  return { message: NO_OWNERS_MESSAGE };
                }
                return value ? undefined : { message: OWNER_REQUIRED_MESSAGE };
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Dueño</Label>
                {hasNoOwners ? (
                  /* Al intentar crear, el mismo aviso aparece como error (abajo) y este se va. */
                  field.state.meta.errors.length === 0 && (
                    <p className="rounded-xl bg-muted px-4 py-3 text-base text-muted-foreground">
                      {NO_OWNERS_MESSAGE}
                    </p>
                  )
                ) : (
                  <Select
                    inputId={field.name}
                    name={field.name}
                    placeholder="Busca por nombre o correo"
                    options={ownerOptions}
                    isInvalid={field.state.meta.errors.length > 0}
                    value={ownerOptions.find((option) => option.value === field.state.value) ?? null}
                    filterOption={(option, search) => {
                      const term = search.trim().toLowerCase();
                      return (
                        option.data.label.toLowerCase().includes(term) ||
                        (option.data.description ?? "").toLowerCase().includes(term)
                      );
                    }}
                    onBlur={field.handleBlur}
                    onChange={(option) => field.handleChange(option?.value ?? "")}
                  />
                )}
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        )}
      </form>
    </Modal>
  );
}
