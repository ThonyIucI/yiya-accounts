import type { IProviderResource } from "@yiya/shared/providers";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type TUpdateProviderPayload,
  updateProviderRequest,
} from "@/modules/providers/services/provider.service";

export const useUpdateProvider = () => {
  const { loading, handleRequest } = useRequest<IProviderResource>();

  const handler = (id: string, payload: TUpdateProviderPayload) =>
    handleRequest(async () => {
      const saved = await updateProviderRequest(id, payload);
      toast.success("Cambios guardados");
      return saved;
    });

  return { loading, handler };
};
