import type { IRentalHistoryResource } from "@yiya/shared/rentals";

import { useRequest } from "@/common/hooks/use-request";
import { listCustomerRentalsRequest } from "@/modules/rentals/services/rental.service";

/**
 * Los alquileres del cliente, abiertos e historial (RF-18). Se pide al abrir el historial,
 * no con la lista (RNF-08). `reset` lo olvida al cambiar de cliente o después de renovar o
 * liberar, para que la próxima vez se pida de nuevo.
 */
export const useCustomerRentalHistory = () => {
  const request = useRequest<IRentalHistoryResource[]>();

  const handler = (customerId: string, signal?: AbortSignal) =>
    request.handleRequest(() => listCustomerRentalsRequest(customerId, signal));

  const reset = () => request.setData(() => null);

  return { history: request.data, loading: request.loading, handler, reset };
};
