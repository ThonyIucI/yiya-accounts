import type { IRentalResource } from "@yiya/shared/rentals";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { type IRenewRentalPayload, renewRentalRequest } from "@/modules/rentals/services/rental.service";

export const useRenewRental = () => {
  const { loading, handleRequest } = useRequest<IRentalResource>();

  const handler = (id: string, payload: IRenewRentalPayload) =>
    handleRequest(async () => {
      const renewed = await renewRentalRequest(id, payload);
      toast.success(`${renewed.service.name} renovado`);
      return renewed;
    });

  return { loading, handler };
};
