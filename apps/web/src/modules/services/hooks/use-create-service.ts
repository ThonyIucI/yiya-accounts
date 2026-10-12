import type { ICatalogServiceResource } from "@yiya/shared/services";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type ICreateServicePayload,
  createServiceRequest,
} from "@/modules/services/services/service.service";

export const useCreateService = () => {
  const { loading, handleRequest } = useRequest<ICatalogServiceResource>();

  const handler = (payload: ICreateServicePayload) =>
    handleRequest(async () => {
      const created = await createServiceRequest(payload);
      toast.success(`Servicio «${created.name}» creado`);
      return created;
    });

  return { loading, handler };
};
