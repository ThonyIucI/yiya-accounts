import { parseUserRole, type TUserRole } from "@yiya/shared/roles";

import { authClient } from "@/lib/auth-client";

/** Rol de plataforma de la sesión actual; `null` sin sesión. */
export const useSessionRole = (): TUserRole | null => {
  const { data: session } = authClient.useSession();
  return session ? parseUserRole(session.user.role) : null;
};
