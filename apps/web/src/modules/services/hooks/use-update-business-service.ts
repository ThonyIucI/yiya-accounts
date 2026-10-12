import type { IBusinessServiceResource } from "@yiya/shared/services";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type IUpdateBusinessServicePayload,
  updateBusinessServiceRequest,
} from "@/modules/services/services/service.service";

const successMessage = (
  saved: IBusinessServiceResource,
  payload: IUpdateBusinessServicePayload,
): string => {
  if (payload.isActive === undefined) {
    return `Precio de «${saved.name}» guardado`;
  }
  return saved.isActive ? `«${saved.name}» activado` : `«${saved.name}» desactivado`;
};

/** Activa/desactiva un servicio en el negocio actual o cambia uno de sus precios. */
export const useUpdateBusinessService = () => {
  const { loading, handleRequest } = useRequest<IBusinessServiceResource>();

  const handler = (serviceId: string, payload: IUpdateBusinessServicePayload) =>
    handleRequest(async () => {
      const saved = await updateBusinessServiceRequest(serviceId, payload);
      toast.success(successMessage(saved, payload));
      return saved;
    });

  return { loading, handler };
};
