import { Button } from "@yiya/ui/components/button";
import { Input } from "@yiya/ui/components/input";
import { Label } from "@yiya/ui/components/label";
import { USER_MIN_PASSWORD_LENGTH } from "@yiya/shared/users";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import z from "zod";

import FieldError from "@/common/components/field-error";
import Modal from "@/common/components/modal";
import type { ICreateUserPayload } from "@/modules/users/services/user.service";

const FORM_ID = "user-form";

const formSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre"),
  email: z.email("Correo inválido"),
  password: z
    .string()
    .min(USER_MIN_PASSWORD_LENGTH, "La contraseña debe tener al menos 8 caracteres"),
});

const DEFAULTS = { name: "", email: "", password: "" };

interface IUserFormModalProps {
  open: boolean;
  onSubmit: (payload: ICreateUserPayload) => Promise<unknown>;
  onClose: () => void;
}

/**
 * Alta de un usuario. La contraseña se ve en claro a propósito: la elige el superadmin y
 * se la pasa al cliente, así que tiene que poder leerla y copiarla.
 */
export default function UserFormModal({ open, onSubmit, onClose }: IUserFormModalProps) {
  const form = useForm({
    defaultValues: DEFAULTS,
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      await onSubmit({
        name: value.name.trim(),
        email: value.email.trim().toLowerCase(),
        password: value.password,
      });
      form.reset();
    },
  });

  return (
    <Modal
      open={open}
      title="Nuevo usuario"
      description="Podrá entrar con este correo y contraseña. Pásaselos tú."
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
                Crear usuario
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
                placeholder="Ingresa el nombre"
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Correo</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="Ingresa el correo"
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Contraseña</Label>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                aria-invalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
