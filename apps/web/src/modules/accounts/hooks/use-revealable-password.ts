import { useState } from "react";

import { useAccountPassword } from "@/modules/accounts/hooks/use-account-password";
import { getAccountPasswordRequest } from "@/modules/accounts/services/account.service";

export const HIDDEN_PASSWORD = "••••••••";

/**
 * La contraseña oculta de una cuenta en un listado (card o tabla), con su ojo y su copiar.
 * Se pide al server recién al tocar uno de los dos, y después queda en memoria.
 */
export const useRevealablePassword = (accountId: string) => {
  const AccountPassword = useAccountPassword();
  const [isVisible, setIsVisible] = useState(false);

  const toggle = () => {
    if (isVisible) {
      setIsVisible(false);
      return;
    }
    setIsVisible(true);
    if (AccountPassword.password === null && !AccountPassword.loading) {
      AccountPassword.handler(accountId);
    }
  };

  /*
    Para `CopyButton`: si todavía no llegó, se pasa la promesa (así iPhone copia dentro del
    mismo toque). Si el server falla, `copyToClipboard` muestra su error.
  */
  const getText = (): string | Promise<string> =>
    AccountPassword.password ??
    getAccountPasswordRequest(accountId).then(({ password }) => {
      AccountPassword.remember(password);
      return password;
    });

  const text =
    isVisible && AccountPassword.loading
      ? "Cargando…"
      : isVisible && AccountPassword.password !== null
        ? AccountPassword.password
        : HIDDEN_PASSWORD;

  return { isVisible, toggle, text, getText };
};
