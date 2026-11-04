import type { IRentalResource } from "@yiya/shared/rentals";

import { useRequest } from "@/common/hooks/use-request";
import { listRentalsRequest } from "@/modules/rentals/services/rental.service";

const byExpiresOn = (a: IRentalResource, b: IRentalResource) => a.expiresOn.localeCompare(b.expiresOn);

/**
 * Alquileres abiertos del negocio. `onUpsert` y `onRemove` lo mantienen al día con lo que
 * devuelve la API, sin volver a pedir la lista (RNF-08).
 */
export const useListRentals = () => {
  const request = useRequest<IRentalResource[]>();

  const handler = (signal?: AbortSignal) => request.handleRequest(() => listRentalsRequest(signal));

  const onUpsert = (saved: IRentalResource[]) =>
    request.setData((previous) => {
      const savedIds = new Set(saved.map((item) => item.id));
      return [...(previous ?? []).filter((item) => !savedIds.has(item.id)), ...saved].sort(byExpiresOn);
    });

  const onRemove = (id: string) =>
    request.setData((previous) => (previous ?? []).filter((item) => item.id !== id));

  return { rentals: request.data ?? [], loading: request.loading, handler, onUpsert, onRemove };
};
