import type { ICustomerResource } from "@yiya/shared/customers";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type ICreateCustomerPayload,
  createCustomerRequest,
} from "@/modules/customers/services/customer.service";

export const useCreateCustomer = () => {
  const { loading, handleRequest } = useRequest<ICustomerResource>();

  const handler = (payload: ICreateCustomerPayload) =>
    handleRequest(async () => {
      const created = await createCustomerRequest(payload);
      toast.success(`Cliente «${created.name}» agregado`);
      return created;
    });

  return { loading, handler };
};
