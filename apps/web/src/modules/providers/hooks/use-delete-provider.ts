import type { IProviderResource } from "@yiya/shared/providers";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteProviderRequest } from "@/modules/providers/services/provider.service";

export const useDeleteProvider = () => {
  const { loading, handleRequest } = useRequest<{ id: string }>();

  const handler = (provider: IProviderResource) =>
    handleRequest(async () => {
      const deleted = await deleteProviderRequest(provider.id);
      toast.success(`«${provider.name}» eliminado`);
      return deleted;
    });

  return { loading, handler };
};
