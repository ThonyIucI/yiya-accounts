import type { IBusinessResource } from "@yiya/shared/businesses";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type IUpdateBusinessPayload,
  updateBusinessRequest,
} from "@/modules/businesses/services/business.service";

const successMessage = (saved: IBusinessResource, payload: IUpdateBusinessPayload): string => {
  if (payload.isActive === undefined) {
    return "Cambios guardados";
  }
  return saved.isActive ? `«${saved.name}» activado` : `«${saved.name}» desactivado`;
};

export const useUpdateBusiness = () => {
  const { loading, handleRequest } = useRequest<IBusinessResource>();

  const handler = (id: string, payload: IUpdateBusinessPayload) =>
    handleRequest(async () => {
      const saved = await updateBusinessRequest(id, payload);
      toast.success(successMessage(saved, payload));
      return saved;
    });

  return { loading, handler };
};
