import { navItemsForRole } from "@/common/constants/routes";
import { useSessionRole } from "@/common/hooks/use-session-role";

/**
 * Enlaces de navegación de la sesión actual. Sin sesión es una lista vacía, y de eso
 * dependen la barra inferior **y** el espacio que se le reserva debajo del contenido.
 */
export const useNavItems = () => navItemsForRole(useSessionRole());
