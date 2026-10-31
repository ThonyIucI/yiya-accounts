import type { ICustomerResource } from "@yiya/shared/customers";

import { useRequest } from "@/common/hooks/use-request";
import { listCustomersRequest } from "@/modules/customers/services/customer.service";

/** Clientes del negocio. `onUpsert` y `onRemove` lo mantienen al día sin recargar. */
export const useListCustomers = () => {
  const request = useRequest<ICustomerResource[]>();

  const handler = (signal?: AbortSignal) => request.handleRequest(() => listCustomersRequest(signal));

  const onUpsert = (saved: ICustomerResource) =>
    request.setData((previous) => {
      const items = previous ?? [];
      return items.some((item) => item.id === saved.id)
        ? items.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...items];
    });

  const onRemove = (id: string) =>
    request.setData((previous) => (previous ?? []).filter((item) => item.id !== id));

  return { customers: request.data ?? [], loading: request.loading, handler, onUpsert, onRemove };
};
