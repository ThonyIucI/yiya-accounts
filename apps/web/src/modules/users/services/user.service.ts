import type { IUserResource } from "@yiya/shared/users";

import { apiRequest } from "@/lib/api";

export interface ICreateUserPayload {
  name: string;
  email: string;
  password: string;
}

/** Todos los usuarios, del más nuevo al más viejo. Solo SUPERADMIN. */
export const listUsersRequest = (signal?: AbortSignal) =>
  apiRequest<IUserResource[]>("/users", { signal });

export const createUserRequest = (payload: ICreateUserPayload) =>
  apiRequest<IUserResource>("/users", { method: "POST", body: payload });
