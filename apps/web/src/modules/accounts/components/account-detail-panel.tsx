import { Button } from "@yiya/ui/components/button";
import { Switch } from "@yiya/ui/components/switch";
import type { IAccountResource, IProfileResource } from "@yiya/shared/accounts";
import {
  CalendarClock,
  ClipboardCopy,
  Copy,
  Eye,
  EyeOff,
  History,
  Lock,
  Mail,
  MessageSquareText,
  Pencil,
  Plus,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

import { DetailRow, DetailSection } from "@/common/components/detail-section";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import SidePanel from "@/common/components/side-panel";
import { copyToClipboard } from "@/common/utils/clipboard";
import { useAccountPassword } from "@/modules/accounts/hooks/use-account-password";
import { buildAccessText } from "@/modules/accounts/utils/access-text";
import ServiceAvatar from "@/modules/services/components/service-avatar";

import ProfileList from "./profile-list";

const HIDDEN_PASSWORD = "••••••••";

interface IAccountDetailPanelProps {
  /** La cuenta abierta; `null` cierra el panel. */
  account: IAccountResource | null;
  isToggling: boolean;
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
 * Acceso (correo y contraseña, cada uno con su copiar), Compra, Nota y Perfiles. «Copiar
 * acceso» del `⋯` copia todo listo para WhatsApp. La contraseña solo se ve acá.
 *
 * Las compras y renovaciones todavía no están: sus filas quedan vacías («—»), sin datos
 * inventados, hasta que se implementen.
 */
export default function AccountDetailPanel({
  account,
  isToggling,
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

  const copyAccess = () => {
    if (current && password !== null) {
      copyToClipboard(buildAccessText(current.service.name, current.email, password), "Acceso copiado");
    }
  };

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
              disabled={isToggling}
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
              <p className="truncate text-base text-muted-foreground">{current.email}</p>
            </div>
          </div>

          <DetailSection title="Acceso">
            <DetailRow
              icon={Mail}
              label="Correo"
              actions={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Copiar correo"
                  aria-label="Copiar correo"
                  onClick={() => copyToClipboard(current.email, "Correo copiado")}
                >
                  <Copy />
                </Button>
              }
            >
              {current.email}
            </DetailRow>
            <DetailRow
              icon={Lock}
              label="Contraseña"
              actions={
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={password === null}
                    aria-label={isPasswordVisible ? "Ocultar contraseña" : "Ver contraseña"}
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                  >
                    {isPasswordVisible ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={password === null}
                    title="Copiar contraseña"
                    aria-label="Copiar contraseña"
                    onClick={() => password !== null && copyToClipboard(password, "Contraseña copiada")}
                  >
                    <Copy />
                  </Button>
                </>
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
          </DetailSection>

          {/* Compras y renovaciones: pendientes. Las filas quedan vacías, sin datos inventados. */}
          <DetailSection title="Compra">
            <DetailRow icon={Truck} label="Proveedor">
              {current.provider.name}
            </DetailRow>
            <DetailRow icon={History} label="Última renovación" />
            <DetailRow icon={CalendarClock} label="Próximo vencimiento" />
            <DetailRow icon={Wallet} label="Pagado" />
          </DetailSection>

          <DetailSection title="Nota">
            <p className="flex items-start gap-2 text-base">
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
                disabled={isAddingProfile}
                onClick={() => onAddProfile(current)}
              >
                <Plus />
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
