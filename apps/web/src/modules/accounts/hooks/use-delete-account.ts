import type { IAccountResource } from "@yiya/shared/accounts";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import { deleteAccountRequest } from "@/modules/accounts/services/account.service";

export const useDeleteAccount = () => {
  const { loading, handleRequest } = useRequest<{ id: string }>();

  const handler = (account: IAccountResource) =>
    handleRequest(async () => {
      const deleted = await deleteAccountRequest(account.id);
      toast.success(`Cuenta ${account.email} eliminada`);
      return deleted;
    });

  return { loading, handler };
};
