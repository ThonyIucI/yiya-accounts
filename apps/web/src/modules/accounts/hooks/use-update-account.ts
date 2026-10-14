import type { IAccountResource } from "@yiya/shared/accounts";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type IUpdateAccountPayload,
  updateAccountRequest,
} from "@/modules/accounts/services/account.service";

const successMessage = (saved: IAccountResource, payload: IUpdateAccountPayload): string => {
  if (payload.isActive === undefined) {
    return "Cambios guardados";
  }
  return saved.isActive ? "Cuenta activada" : "Cuenta desactivada";
};

export const useUpdateAccount = () => {
  const { loading, handleRequest } = useRequest<IAccountResource>();

  const handler = (id: string, payload: IUpdateAccountPayload) =>
    handleRequest(async () => {
      const saved = await updateAccountRequest(id, payload);
      toast.success(successMessage(saved, payload));
      return saved;
    });

  return { loading, handler };
};
