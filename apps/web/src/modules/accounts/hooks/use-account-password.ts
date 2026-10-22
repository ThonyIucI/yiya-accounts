import { useRequest } from "@/common/hooks/use-request";
import { getAccountPasswordRequest } from "@/modules/accounts/services/account.service";

/**
 * La contraseña de una cuenta, pedida recién cuando se toca el ojo o copiar. Queda en
 * memoria mientras el detalle está abierto: no se vuelve a pedir en cada toque.
 */
export const useAccountPassword = () => {
  const request = useRequest<string>();

  const handler = (accountId: string) =>
    request.handleRequest(async () => (await getAccountPasswordRequest(accountId)).password);

  /* Al cambiar de cuenta o cerrar el detalle, se olvida. */
  const forget = () => request.setData(() => null);

  /* Guarda una contraseña que se trajo por otro lado (p. ej. al copiarla). */
  const remember = (password: string) => request.setData(() => password);

  return { password: request.data, loading: request.loading, handler, forget, remember };
};
