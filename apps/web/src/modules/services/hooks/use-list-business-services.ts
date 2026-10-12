import type { IBusinessServiceResource } from "@yiya/shared/services";

import { useRequest } from "@/common/hooks/use-request";
import { listBusinessServicesRequest } from "@/modules/services/services/service.service";

/** Los servicios dentro del negocio en el que se está. `onUpsert` tras cambiar uno. */
export const useListBusinessServices = () => {
  const request = useRequest<IBusinessServiceResource[]>();

  const handler = (signal?: AbortSignal) =>
    request.handleRequest(() => listBusinessServicesRequest(signal));

  const onUpsert = (saved: IBusinessServiceResource) =>
    request.setData((previous) => {
      const items = previous ?? [];
      return items.some((item) => item.id === saved.id)
        ? items.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...items];
    });

  return { services: request.data ?? [], loading: request.loading, handler, onUpsert };
};
