import { Button } from "@yiya/ui/components/button";
import type { IAccountResource } from "@yiya/shared/accounts";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { useAccountPassword } from "@/modules/accounts/hooks/use-account-password";

const HIDDEN_PASSWORD = "••••••••";

interface IAccountCredentialsProps {
  account: IAccountResource;
}

/**
 * Correo arriba y contraseña abajo, para la tabla. La contraseña sale oculta; el ojo la pide
 * al server recién al tocarlo y la muestra. Tocar el ojo no abre el detalle de la fila.
 */
export default function AccountCredentials({ account }: IAccountCredentialsProps) {
  const AccountPassword = useAccountPassword();
  const [isVisible, setIsVisible] = useState(false);

  const handleToggle = () => {
    if (isVisible) {
      setIsVisible(false);
      return;
    }
    setIsVisible(true);
    if (AccountPassword.password === null) {
      AccountPassword.handler(account.id);
    }
  };

  const shownPassword =
    isVisible && AccountPassword.password !== null ? AccountPassword.password : HIDDEN_PASSWORD;

  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-foreground">{account.email}</p>
      <div className="flex items-center gap-1">
        <span className="truncate font-mono text-muted-foreground">
          {isVisible && AccountPassword.loading ? "Cargando…" : shownPassword}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={isVisible ? "Ocultar contraseña" : "Ver contraseña"}
          onClick={(event) => {
            event.stopPropagation();
            handleToggle();
          }}
        >
          {isVisible ? <EyeOff /> : <Eye />}
        </Button>
      </div>
    </div>
  );
}
