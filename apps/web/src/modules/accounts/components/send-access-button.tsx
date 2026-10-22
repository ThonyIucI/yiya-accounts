import type { IAccountResource } from "@yiya/shared/accounts";
import { cn } from "@yiya/ui/lib/utils";
import { SendHorizontal } from "lucide-react";

import CopyButton from "@/common/components/copy-button";
import { getAccountPasswordRequest } from "@/modules/accounts/services/account.service";
import { buildAccessText } from "@/modules/accounts/utils/access-text";

interface ISendAccessButtonProps {
  account: IAccountResource;
  /** Si la contraseña ya se trajo, se usa esa; si no, se pide al tocar. */
  getPassword?: () => string | Promise<string>;
  isBordered?: boolean;
}

const fetchPassword = (accountId: string) =>
  getAccountPasswordRequest(accountId).then(({ password }) => password);

/**
 * «Enviar»: copia el acceso de la cuenta (correo y contraseña) listo para pegarlo en
 * WhatsApp, con el cargando → check de `CopyButton`. La contraseña se pide en el mismo
 * toque (una promesa), así funciona también en iPhone.
 */
export default function SendAccessButton({ account, getPassword, isBordered = false }: ISendAccessButtonProps) {
  const getAccessText = async () =>
    buildAccessText(
      account.service.name,
      account.email,
      await (getPassword ? getPassword() : fetchPassword(account.id)),
    );

  return (
    <CopyButton
      label={`Enviar el acceso de ${account.email} (se copia para pegarlo en WhatsApp)`}
      icon={SendHorizontal}
      getText={getAccessText}
      className={cn(
        "text-success hover:bg-success/15 hover:text-success",
        isBordered ? "border border-border bg-card" : "bg-success/15",
      )}
    />
  );
}
