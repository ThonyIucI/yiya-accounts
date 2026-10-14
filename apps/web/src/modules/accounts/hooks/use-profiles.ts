import type { IAccountResource, IProfileResource } from "@yiya/shared/accounts";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type IUpdateProfilePayload,
  addProfileRequest,
  deleteProfileRequest,
  updateProfileRequest,
} from "@/modules/accounts/services/account.service";

export const useAddProfile = () => {
  const { loading, handleRequest } = useRequest<IAccountResource>();

  const handler = (accountId: string) =>
    handleRequest(async () => {
      const saved = await addProfileRequest(accountId);
      toast.success(`${saved.profiles.at(-1)?.name ?? "Perfil"} agregado`);
      return saved;
    });

  return { loading, handler };
};

/* Sin toast de éxito: se guarda solo mientras se escribe, como los precios. */
export const useUpdateProfile = () => {
  const { loading, handleRequest } = useRequest<IProfileResource>();

  const handler = (id: string, payload: IUpdateProfilePayload) =>
    handleRequest(() => updateProfileRequest(id, payload));

  return { loading, handler };
};

export const useDeleteProfile = () => {
  const { loading, handleRequest } = useRequest<{ id: string }>();

  const handler = (profile: IProfileResource) =>
    handleRequest(async () => {
      const deleted = await deleteProfileRequest(profile.id);
      toast.success(`«${profile.name}» eliminado`);
      return deleted;
    });

  return { loading, handler };
};
