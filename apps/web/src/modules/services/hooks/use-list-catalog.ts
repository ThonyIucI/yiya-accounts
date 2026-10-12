import type { ICatalogServiceResource } from "@yiya/shared/services";

import { useRequest } from "@/common/hooks/use-request";
import { listCatalogRequest } from "@/modules/services/services/service.service";

/** El catálogo global (superadmin). `onUpsert` lo mantiene al día tras crear o editar. */
export const useListCatalog = () => {
  const request = useRequest<ICatalogServiceResource[]>();

  const handler = (signal?: AbortSignal) => request.handleRequest(() => listCatalogRequest(signal));

  const onUpsert = (saved: ICatalogServiceResource) =>
    request.setData((previous) => {
      const items = previous ?? [];
      return items.some((item) => item.id === saved.id)
        ? items.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...items];
    });

  /** Al activar o desactivar en el negocio actual, sin volver a pedir el catálogo. */
  const onActiveCountChange = (serviceId: string, delta: number) =>
    request.setData((previous) =>
      (previous ?? []).map((item) =>
        item.id === serviceId
          ? { ...item, activeInCount: Math.max(0, item.activeInCount + delta) }
          : item,
      ),
    );

  return {
    services: request.data ?? [],
    loading: request.loading,
    handler,
    onUpsert,
    onActiveCountChange,
  };
};
