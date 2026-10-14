import type { IAccountResource } from "@yiya/shared/accounts";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type ICreateAccountPayload,
  createAccountRequest,
} from "@/modules/accounts/services/account.service";

export const useCreateAccount = () => {
  const { loading, handleRequest } = useRequest<IAccountResource>();

  const handler = (payload: ICreateAccountPayload) =>
    handleRequest(async () => {
      const created = await createAccountRequest(payload);
      toast.success(`Cuenta de ${created.service.name} registrada`);
      return created;
    });

  return { loading, handler };
};
