import type { IRentalResource } from "@yiya/shared/rentals";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type TUpdateRentalPayload,
  updateRentalRequest,
} from "@/modules/rentals/services/rental.service";

export const useUpdateRental = () => {
  const { loading, handleRequest } = useRequest<IRentalResource>();

  const handler = (id: string, payload: TUpdateRentalPayload) =>
    handleRequest(async () => {
      const updated = await updateRentalRequest(id, payload);
      toast.success("Alquiler actualizado");
      return updated;
    });

  return { loading, handler };
};
