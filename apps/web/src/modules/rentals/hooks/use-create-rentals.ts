import type { IRentalResource } from "@yiya/shared/rentals";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type ICreateRentalsPayload,
  createRentalsRequest,
} from "@/modules/rentals/services/rental.service";

export const useCreateRentals = () => {
  const { loading, handleRequest } = useRequest<IRentalResource[]>();

  const handler = (payload: ICreateRentalsPayload) =>
    handleRequest(async () => {
      const created = await createRentalsRequest(payload);
      const count = created.length;
      toast.success(count === 1 ? "Perfil alquilado" : `${count} perfiles alquilados`);
      return created;
    });

  return { loading, handler };
};
