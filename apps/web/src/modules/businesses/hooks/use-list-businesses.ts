import type { IBusinessResource } from "@yiya/shared/businesses";

import { useRequest } from "@/common/hooks/use-request";
import { listBusinessesRequest } from "@/modules/businesses/services/business.service";

/** Listado de negocios. `onUpsert` lo mantiene al día tras crear o editar sin recargar. */
export const useListBusinesses = () => {
  const request = useRequest<IBusinessResource[]>();

  const handler = (signal?: AbortSignal) =>
    request.handleRequest(() => listBusinessesRequest(signal));

  const onUpsert = (saved: IBusinessResource) =>
    request.setData((previous) => {
      const items = previous ?? [];
      return items.some((item) => item.id === saved.id)
        ? items.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...items];
    });

  return { businesses: request.data ?? [], loading: request.loading, handler, onUpsert };
};
