import type { IUserResource } from "@yiya/shared/users";
import { toast } from "sonner";

import { useRequest } from "@/common/hooks/use-request";
import {
  type ICreateUserPayload,
  createUserRequest,
  listUsersRequest,
} from "@/modules/users/services/user.service";

/** Usuarios de la plataforma: la lista y el alta. */
export const useUsers = () => {
  const request = useRequest<IUserResource[]>();

  const handler = (signal?: AbortSignal) =>
    request.handleRequest(() => listUsersRequest(signal));

  const create = async (payload: ICreateUserPayload) => {
    try {
      const created = await createUserRequest(payload);
      request.setData((previous) => [created, ...(previous ?? [])]);
      toast.success(`Usuario «${created.name}» creado`);
      return created;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el usuario.");
      return null;
    }
  };

  return { users: request.data ?? [], loading: request.loading, handler, create };
};
