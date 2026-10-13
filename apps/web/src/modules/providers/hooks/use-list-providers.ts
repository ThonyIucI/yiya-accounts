import type { IProviderResource } from "@yiya/shared/providers";

import { useRequest } from "@/common/hooks/use-request";
import { listProvidersRequest } from "@/modules/providers/services/provider.service";

/** Proveedores del negocio. `onUpsert` y `onRemove` lo mantienen al día sin recargar. */
export const useListProviders = () => {
  const request = useRequest<IProviderResource[]>();

  const handler = (signal?: AbortSignal) => request.handleRequest(() => listProvidersRequest(signal));

  const onUpsert = (saved: IProviderResource) =>
    request.setData((previous) => {
      const items = previous ?? [];
      return items.some((item) => item.id === saved.id)
        ? items.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...items];
    });

  const onRemove = (id: string) =>
    request.setData((previous) => (previous ?? []).filter((item) => item.id !== id));

  return { providers: request.data ?? [], loading: request.loading, handler, onUpsert, onRemove };
};
