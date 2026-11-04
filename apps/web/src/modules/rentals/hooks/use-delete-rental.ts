import type { IRentalResource } from "@yiya/shared/rentals";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteRentalRequest } from "@/modules/rentals/services/rental.service";

export const useDeleteRental = () => {
  const { loading, handleRequest } = useRequest<{ id: string }>();

  const handler = (rental: IRentalResource) =>
    handleRequest(async () => {
      const deleted = await deleteRentalRequest(rental.id);
      toast.success(`Se eliminó el alquiler de ${rental.service.name}`);
      return deleted;
    });

  return { loading, handler };
};
