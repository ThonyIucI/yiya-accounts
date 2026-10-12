import { parseUserRole } from "@yiya/shared/roles";

import { navItemsForRole } from "@/common/constants/routes";
import { authClient } from "@/lib/auth-client";

/**
 * Enlaces de navegación de la sesión actual. Sin sesión es una lista vacía, y de eso
 * dependen la barra inferior **y** el espacio que se le reserva debajo del contenido.
 */
export const useNavItems = () => {
  const { data: session } = authClient.useSession();
  return navItemsForRole(session ? parseUserRole(session.user.role) : null);
};
