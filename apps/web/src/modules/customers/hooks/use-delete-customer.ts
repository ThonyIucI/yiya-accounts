import type { ICustomerResource } from "@yiya/shared/customers";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteCustomerRequest } from "@/modules/customers/services/customer.service";

export const useDeleteCustomer = () => {
  const { loading, handleRequest } = useRequest<{ id: string }>();

  const handler = (customer: ICustomerResource) =>
    handleRequest(async () => {
      const deleted = await deleteCustomerRequest(customer.id);
      toast.success(`«${customer.name}» eliminado`);
      return deleted;
    });

  return { loading, handler };
};
