import type { IProviderResource } from "@yiya/shared/providers";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type ICreateProviderPayload,
  createProviderRequest,
} from "@/modules/providers/services/provider.service";

export const useCreateProvider = () => {
  const { loading, handleRequest } = useRequest<IProviderResource>();

  const handler = (payload: ICreateProviderPayload) =>
    handleRequest(async () => {
      const created = await createProviderRequest(payload);
      toast.success(`Proveedor «${created.name}» agregado`);
      return created;
    });

  return { loading, handler };
};
