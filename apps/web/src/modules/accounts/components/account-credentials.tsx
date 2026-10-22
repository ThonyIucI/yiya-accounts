import type { IAccountResource } from "@yiya/shared/accounts";

import { useRevealablePassword } from "@/modules/accounts/hooks/use-revealable-password";

import PasswordEyeButton from "./password-eye-button";

interface IAccountCredentialsProps {
  account: IAccountResource;
}

/**
 * Correo arriba y contraseña abajo, para la tabla. La contraseña sale oculta; el ojo va a
 * su izquierda (así no se corre cuando cambia el ancho del texto) y la pide al tocarlo.
 */
export default function AccountCredentials({ account }: IAccountCredentialsProps) {
  const password = useRevealablePassword(account.id);

  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-foreground">{account.email}</p>
      <div className="-ml-1.5 flex items-center gap-1">
        <PasswordEyeButton size="xs" isVisible={password.isVisible} onToggle={password.toggle} />
        <span className="truncate font-mono text-muted-foreground">{password.text}</span>
      </div>
    </div>
  );
}
