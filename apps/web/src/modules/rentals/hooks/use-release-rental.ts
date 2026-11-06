import type { IRentalResource } from "@yiya/shared/rentals";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { releaseRentalRequest } from "@/modules/rentals/services/rental.service";

export const useReleaseRental = () => {
  const { loading, handleRequest } = useRequest<{ id: string }>();

  const handler = (rental: IRentalResource) =>
    handleRequest(async () => {
      const released = await releaseRentalRequest(rental.id);
      toast.success(`Se liberó ${rental.service.name} de ${rental.customer.name}`);
      return released;
    });

  return { loading, handler };
};
