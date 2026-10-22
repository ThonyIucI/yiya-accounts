import { Button } from "@yiya/ui/components/button";
import { Switch } from "@yiya/ui/components/switch";
import type { IAccountResource, IProfileResource } from "@yiya/shared/accounts";
import {
  ClipboardCopy,
  Loader2,
  Lock,
  Mail,
  MessageSquareText,
  Pencil,
  Plus,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DetailList, DetailRow, DetailSection } from "@/common/components/detail-section";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import SidePanel from "@/common/components/side-panel";
import { copyToClipboard } from "@/common/utils/clipboard";
import { useAccountPassword } from "@/modules/accounts/hooks/use-account-password";
import { HIDDEN_PASSWORD } from "@/modules/accounts/hooks/use-revealable-password";
import { buildAccessText } from "@/modules/accounts/utils/access-text";
import ServiceAvatar from "@/modules/services/components/service-avatar";

import PasswordEyeButton from "./password-eye-button";
import ProfileList from "./profile-list";

const PASSWORD_LOADING_MESSAGE = "Un momento: estamos trayendo la contraseña.";

interface IAccountDetailPanelProps {
  /** La cuenta abierta; `null` cierra el panel. */
  account: IAccountResource | null;
  isAddingProfile: boolean;
  onToggleActive: (account: IAccountResource) => void;
  onEdit: (account: IAccountResource) => void;
  onDelete: (account: IAccountResource) => void;
  onAddProfile: (account: IAccountResource) => void;
  onProfileSaved: (account: IAccountResource, profile: IProfileResource) => void;
  onProfileDelete: (account: IAccountResource, profile: IProfileResource) => void;
  onClose: () => void;
}

/**
 * Detalle lateral de una cuenta, con la estructura del detalle de cliente de id-pos:
 * Cuenta (correo, contraseña —cada uno con su copiar— y proveedor), Nota y Perfiles. «Copiar
 * acceso» del `⋯` copia todo listo para WhatsApp. La contraseña solo se ve acá.
 *
 * Las compras y renovaciones no se muestran hasta que existan: no hay filas vacías.
 */
export default function AccountDetailPanel({
  account,
  isAddingProfile,
  onToggleActive,
  onEdit,
  onDelete,
  onAddProfile,
  onProfileSaved,
  onProfileDelete,
  onClose,
}: IAccountDetailPanelProps) {
  const AccountPassword = useAccountPassword();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  /* El panel se queda con la última cuenta mientras se anima al cerrarse. */
  const [shown, setShown] = useState<IAccountResource | null>(account);
  const accountId = account?.id ?? null;

  useEffect(() => {
    if (account) {
      setShown(account);
    }
  }, [account]);

  /*
    La contraseña se pide al abrir y no al tocar copiar: en iPhone, copiar después de esperar
    la red pierde el permiso del toque y falla. Se olvida al cerrar o cambiar de cuenta.
  */
  useEffect(() => {
    setIsPasswordVisible(false);
    AccountPassword.forget();
    if (accountId) {
      AccountPassword.handler(accountId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  const password = AccountPassword.password;
  const current = account ?? shown;

  /*
    Los botones de la contraseña nunca se apagan: si todavía no llegó, el toque avisa; si no
    se pudo traer, la vuelve a pedir (y el error, si sigue, sale en un toast).
  */
  const withPassword = (use: (value: string) => void) => {
    if (password !== null) {
      use(password);
      return;
    }
    if (AccountPassword.loading) {
      toast.info(PASSWORD_LOADING_MESSAGE);
      return;
    }
    if (current) {
      AccountPassword.handler(current.id);
    }
  };

  /* Para el botón de copiar: `null` mientras no llegó (y `withPassword` ya avisó). */
  const getPasswordText = (): string | null => {
    let value: string | null = null;
    withPassword((ready) => {
      value = ready;
    });
    return value;
  };

  const copyAccess = () =>
    withPassword((value) => {
      if (current) {
        copyToClipboard(buildAccessText(current.service.name, current.email, value), "Acceso copiado");
      }
    });

  const actions: IRowAction[] = current
    ? [
        { icon: ClipboardCopy, label: "Copiar acceso", onClick: copyAccess },
        { icon: Pencil, label: "Editar", onClick: () => onEdit(current) },
        { icon: Trash2, label: "Eliminar", variant: "destructive", onClick: () => onDelete(current) },
      ]
    : [];

  return (
    <SidePanel
      open={account !== null}
      label={current ? `Cuenta ${current.email}` : "Cuenta"}
      backLabel="Cuentas"
      onClose={onClose}
      actions={
        current && (
          <>
            <Switch
              checked={current.isActive}
              aria-label={current.isActive ? "Desactivar cuenta" : "Activar cuenta"}
              onCheckedChange={() => onToggleActive(current)}
            />
            <RowActions actions={actions} />
          </>
        )
      }
    >
      {current && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ServiceAvatar
              name={current.service.name}
              imageUrl={current.service.imageUrl}
              className="size-14"
            />
            <div className="min-w-0">
              <h2 className="truncate font-heading text-xl font-extrabold text-foreground">
                {current.service.name}
              </h2>
              <p className="truncate text-sm text-muted-foreground">{current.email}</p>
            </div>
          </div>

          <DetailSection title="Cuenta">
            <DetailList>
              <DetailRow
                icon={Mail}
                label="Correo"
                copy={{
                  label: "Copiar correo",
                  successMessage: "Correo copiado",
                  getText: () => current.email,
                }}
              >
                {current.email}
              </DetailRow>
              <DetailRow
                icon={Lock}
                label="Contraseña"
                copy={{
                  label: "Copiar contraseña",
                  successMessage: "Contraseña copiada",
                  getText: getPasswordText,
                }}
                actions={
                  <PasswordEyeButton
                    isVisible={isPasswordVisible}
                    onToggle={() => withPassword(() => setIsPasswordVisible((visible) => !visible))}
                  />
                }
              >
                <span className="font-mono">
                  {AccountPassword.loading
                    ? "Cargando…"
                    : isPasswordVisible && password !== null
                      ? password
                      : HIDDEN_PASSWORD}
                </span>
              </DetailRow>
              <DetailRow icon={Truck} label="Proveedor">
                {current.provider.name}
              </DetailRow>
            </DetailList>
          </DetailSection>

          <DetailSection title="Nota">
            <p className="flex items-start gap-2 text-sm">
              <MessageSquareText aria-hidden className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
              <span className={current.note ? "text-foreground" : "text-muted-foreground"}>
                {current.note ?? "No hay nota"}
              </span>
            </p>
          </DetailSection>

          <DetailSection
            title={`Perfiles (${current.profiles.length})`}
            action={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAddProfile(current)}
              >
                {isAddingProfile ? (
                  <Loader2 className="animate-spin motion-reduce:animate-none" />
                ) : (
                  <Plus />
                )}
                Agregar perfil
              </Button>
            }
          >
            <ProfileList
              profiles={current.profiles}
              onSaved={(profile) => onProfileSaved(current, profile)}
              onDelete={(profile) => onProfileDelete(current, profile)}
            />
          </DetailSection>
        </div>
      )}
    </SidePanel>
  );
}
