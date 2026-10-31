import type { ICustomerResource } from "@yiya/shared/customers";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type TUpdateCustomerPayload,
  updateCustomerRequest,
} from "@/modules/customers/services/customer.service";

export const useUpdateCustomer = () => {
  const { loading, handleRequest } = useRequest<ICustomerResource>();

  const handler = (id: string, payload: TUpdateCustomerPayload) =>
    handleRequest(async () => {
      const saved = await updateCustomerRequest(id, payload);
      toast.success("Cambios guardados");
      return saved;
    });

  return { loading, handler };
};
