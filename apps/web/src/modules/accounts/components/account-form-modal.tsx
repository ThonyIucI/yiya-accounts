import { Button } from "@yiya/ui/components/button";
import { Input } from "@yiya/ui/components/input";
import { Label } from "@yiya/ui/components/label";
import { Textarea } from "@yiya/ui/components/textarea";
import {
  ACCOUNT_EMAIL_MAX_LENGTH,
  ACCOUNT_MAX_PROFILES,
  ACCOUNT_MIN_PROFILES,
  ACCOUNT_NOTE_MAX_LENGTH,
  ACCOUNT_PASSWORD_MAX_LENGTH,
  type IAccountResource,
} from "@yiya/shared/accounts";
import type { IProviderResource } from "@yiya/shared/providers";
import type { IBusinessServiceResource } from "@yiya/shared/services";
import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import FieldError from "@/common/components/field-error";
import Modal from "@/common/components/modal";
import Select, { CreatableSelect, type IOption } from "@/common/components/select";
import { useAccountPassword } from "@/modules/accounts/hooks/use-account-password";
import { useCreateAccount } from "@/modules/accounts/hooks/use-create-account";
import { useUpdateAccount } from "@/modules/accounts/hooks/use-update-account";
import { useCreateProvider } from "@/modules/providers/hooks/use-create-provider";
import { toServiceOption } from "@/modules/services/utils/service-option";

const FORM_ID = "account-form";
const PROFILES_PATTERN = /^\d+$/;
const PROFILES_MESSAGE = `Escribe un número entero de ${ACCOUNT_MIN_PROFILES} a ${ACCOUNT_MAX_PROFILES}`;

const buildSchema = (isEdit: boolean) =>
  z.object({
    /* Al editar no se muestra: el servicio no se cambia. */
    serviceId: isEdit ? z.string() : z.string().min(1, "Elige el servicio"),
    providerId: z.string().min(1, "Elige el proveedor o crea uno nuevo"),
    email: z.string().trim().pipe(z.email("Escribe un correo válido")),
    password: z
      .string()
      .min(1, "Escribe la contraseña")
      .max(ACCOUNT_PASSWORD_MAX_LENGTH, "La contraseña es demasiado larga"),
    profileCount: isEdit
      ? z.string()
      : z
          .string()
          .trim()
          .refine((value) => {
            const total = Number(value);
            return (
              PROFILES_PATTERN.test(value) &&
              total >= ACCOUNT_MIN_PROFILES &&
              total <= ACCOUNT_MAX_PROFILES
            );
          }, PROFILES_MESSAGE),
    note: z.string().max(ACCOUNT_NOTE_MAX_LENGTH, "La nota es demasiado larga"),
  });

const buildDefaults = (account?: IAccountResource) => ({
  serviceId: account?.service.id ?? "",
  providerId: account?.provider.id ?? "",
  email: account?.email ?? "",
  password: "",
  profileCount: "",
  note: account?.note ?? "",
});

interface IAccountFormModalProps {
  open: boolean;
  /** Sin cuenta: alta. Con cuenta: edición. */
  account?: IAccountResource;
  /** Los servicios del negocio: solo se registran cuentas de los activos. */
  services: IBusinessServiceResource[];
  providers: IProviderResource[];
  /** Un proveedor creado desde acá («Crear «…»»): la lista de proveedores se entera. */
  onProviderCreated: (provider: IProviderResource) => void;
  onSaved: (account: IAccountResource) => void;
  onClose: () => void;
}

/**
 * Alta y edición de una cuenta: servicio, proveedor, correo, contraseña, perfiles y nota.
 * Las compras (precio y vencimiento) van aparte y todavía no están.
 */
export default function AccountFormModal({
  open,
  account,
  services,
  providers,
  onProviderCreated,
  onSaved,
  onClose,
}: IAccountFormModalProps) {
  const isEdit = Boolean(account);
  const CreateAccount = useCreateAccount();
  const UpdateAccount = useUpdateAccount();
  const CreateProvider = useCreateProvider();
  const AccountPassword = useAccountPassword();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  /* La contraseña con la que se abrió la edición: si no cambió, no se manda. */
  const originalPasswordRef = useRef<string | null>(null);

  const serviceOptions: IOption[] = services.filter((item) => item.isActive).map(toServiceOption);
  const providerOptions: IOption[] = providers.map((item) => ({ value: item.id, label: item.name }));

  const form = useForm({
    defaultValues: buildDefaults(account),
    validators: { onSubmit: buildSchema(isEdit) },
    onSubmit: async ({ value }) => {
      const note = value.note.trim() || null;
      const saved = account
        ? await UpdateAccount.handler(account.id, {
            providerId: value.providerId,
            email: value.email.trim(),
            note,
            ...(value.password !== originalPasswordRef.current && { password: value.password }),
          })
        : await CreateAccount.handler({
            serviceId: value.serviceId,
            providerId: value.providerId,
            email: value.email.trim(),
            password: value.password,
            profileCount: Number(value.profileCount.trim()),
            note,
          });

      if (saved) {
        onSaved(saved);
        onClose();
      }
    },
  });

  /* Al editar, la contraseña viene llena (oculta): se pide al abrir. */
  useEffect(() => {
    if (!open) {
      return;
    }
    form.reset(buildDefaults(account));
    setIsPasswordVisible(false);
    originalPasswordRef.current = null;
    AccountPassword.forget();
    if (account) {
      AccountPassword.handler(account.id).then((password) => {
        if (password !== null) {
          originalPasswordRef.current = password;
          form.setFieldValue("password", password);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account]);

  /* Elegir el servicio llena los perfiles con los que trae por defecto. */
  const handleServiceChange = (serviceId: string) => {
    form.setFieldValue("serviceId", serviceId);
    const chosen = services.find((item) => item.id === serviceId);
    if (chosen) {
      form.setFieldValue("profileCount", String(chosen.profilesPerAccount));
    }
  };

  const handleCreateProvider = async (name: string) => {
    const created = await CreateProvider.handler({ name: name.trim(), phone: null, note: null });
    if (created) {
      onProviderCreated(created);
      form.setFieldValue("providerId", created.id);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Editar cuenta" : "Nueva cuenta"}
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
                {isEdit ? "Guardar cambios" : "Registrar cuenta"}
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
          /* El botón nunca se apaga: si falta algo, el clic lo dice; mientras guarda, no repite. */
          if (form.state.isSubmitting) {
            return;
          }
          if (isEdit && AccountPassword.loading) {
            toast.info("Un momento: estamos trayendo la contraseña de la cuenta.");
            return;
          }
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {!isEdit && (
          <form.Field name="serviceId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Servicio</Label>
                <Select
                  inputId={field.name}
                  placeholder="Elige el servicio"
                  options={serviceOptions}
                  noOptionsMessage={() => "Activa un servicio en Servicios"}
                  isInvalid={field.state.meta.errors.length > 0}
                  value={serviceOptions.find((option) => option.value === field.state.value) ?? null}
                  onChange={(option) => option && handleServiceChange(option.value)}
                  onBlur={field.handleBlur}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        )}

        <form.Field name="providerId">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Proveedor</Label>
              <CreatableSelect
                inputId={field.name}
                placeholder="Elige o escribe uno nuevo"
                options={providerOptions}
                isLoading={CreateProvider.loading}
                isDisabled={CreateProvider.loading}
                isInvalid={field.state.meta.errors.length > 0}
                value={providerOptions.find((option) => option.value === field.state.value) ?? null}
                onChange={(option) => option && field.handleChange(option.value)}
                onCreateOption={handleCreateProvider}
                onBlur={field.handleBlur}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Correo de la cuenta</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                maxLength={ACCOUNT_EMAIL_MAX_LENGTH}
                placeholder="cuenta@gmail.com"
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
              <div className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  type={isPasswordVisible ? "text" : "password"}
                  /* Es la de la cuenta de streaming, no la del usuario: que el navegador no la guarde. */
                  autoComplete="new-password"
                  autoCapitalize="none"
                  maxLength={ACCOUNT_PASSWORD_MAX_LENGTH}
                  placeholder={isEdit && AccountPassword.loading ? "Cargando…" : "La que te dio el proveedor"}
                  readOnly={isEdit && AccountPassword.loading}
                  aria-invalid={field.state.meta.errors.length > 0}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={isPasswordVisible ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                >
                  {isPasswordVisible ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        {!isEdit && (
          <form.Field name="profileCount">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Perfiles</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Sale del servicio"
                  aria-invalid={field.state.meta.errors.length > 0}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        )}

        <form.Field name="note">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Nota (opcional)</Label>
              <Textarea
                id={field.name}
                name={field.name}
                rows={3}
                maxLength={ACCOUNT_NOTE_MAX_LENGTH}
                placeholder="Ej. Plan premium, pantalla 4K."
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
