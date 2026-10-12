import type { ICurrentBusiness } from "@yiya/shared/businesses";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { chooseActiveBusinessRequest } from "@/modules/businesses/services/business.service";

/** El superadmin entra a otro negocio desde su menú lateral. */
export const useChooseBusiness = () => {
  const { loading, handleRequest } = useRequest<ICurrentBusiness>();

  const handler = (businessId: string) =>
    handleRequest(async () => {
      const chosen = await chooseActiveBusinessRequest(businessId);
      toast.success(`Ahora trabajas en «${chosen.name}»`);
      return chosen;
    });

  return { loading, handler };
};
