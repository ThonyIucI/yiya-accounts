import type { ICatalogServiceResource } from "@yiya/shared/services";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type TUpdateServicePayload,
  updateServiceRequest,
} from "@/modules/services/services/service.service";

export const useUpdateService = () => {
  const { loading, handleRequest } = useRequest<ICatalogServiceResource>();

  const handler = (id: string, payload: TUpdateServicePayload) =>
    handleRequest(async () => {
      const saved = await updateServiceRequest(id, payload);
      toast.success("Cambios guardados");
      return saved;
    });

  return { loading, handler };
};
