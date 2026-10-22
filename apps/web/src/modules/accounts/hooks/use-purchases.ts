import type { IAccountResource } from "@yiya/shared/accounts";
import type { IPurchaseResource } from "@yiya/shared/purchases";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type IPurchasePayload,
  createPurchaseRequest,
  deletePurchaseRequest,
  updatePurchaseRequest,
} from "@/modules/accounts/services/account.service";

/** Renovar la cuenta: una compra nueva. */
export const useCreatePurchase = () => {
  const { loading, handleRequest } = useRequest<IAccountResource>();

  const handler = (accountId: string, payload: IPurchasePayload) =>
    handleRequest(async () => {
      const saved = await createPurchaseRequest(accountId, payload);
      toast.success("Renovación registrada");
      return saved;
    });

  return { loading, handler };
};

/** Corregir una compra mal cargada. */
export const useUpdatePurchase = () => {
  const { loading, handleRequest } = useRequest<IAccountResource>();

  const handler = (id: string, payload: IPurchasePayload) =>
    handleRequest(async () => {
      const saved = await updatePurchaseRequest(id, payload);
      toast.success("Compra corregida");
      return saved;
    });

  return { loading, handler };
};

export const useDeletePurchase = () => {
  const { loading, handleRequest } = useRequest<IAccountResource>();

  const handler = (purchase: IPurchaseResource) =>
    handleRequest(async () => {
      const saved = await deletePurchaseRequest(purchase.id);
      toast.success("Compra eliminada");
      return saved;
    });

  return { loading, handler };
};
