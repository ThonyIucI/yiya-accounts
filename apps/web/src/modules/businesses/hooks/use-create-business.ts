import type { IBusinessResource } from "@yiya/shared/businesses";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type ICreateBusinessPayload,
  createBusinessRequest,
} from "@/modules/businesses/services/business.service";

export const useCreateBusiness = () => {
  const { loading, handleRequest } = useRequest<IBusinessResource>();

  const handler = (payload: ICreateBusinessPayload) =>
    handleRequest(async () => {
      const created = await createBusinessRequest(payload);
      toast.success(`Negocio «${created.name}» creado`);
      return created;
    });

  return { loading, handler };
};
