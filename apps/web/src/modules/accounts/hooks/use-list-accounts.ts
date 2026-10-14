import type { IAccountResource, IProfileResource } from "@yiya/shared/accounts";

import { useRequest } from "@/common/hooks/use-request";
import { listAccountsRequest } from "@/modules/accounts/services/account.service";

/** Cuentas del negocio. `onUpsert`, `onRemove` y los de perfiles lo mantienen al día. */
export const useListAccounts = () => {
  const request = useRequest<IAccountResource[]>();

  const handler = (signal?: AbortSignal) => request.handleRequest(() => listAccountsRequest(signal));

  const onUpsert = (saved: IAccountResource) =>
    request.setData((previous) => {
      const items = previous ?? [];
      return items.some((item) => item.id === saved.id)
        ? items.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...items];
    });

  const onRemove = (id: string) =>
    request.setData((previous) => (previous ?? []).filter((item) => item.id !== id));

  /** Un perfil cambió (nombre o PIN): se reemplaza dentro de su cuenta. */
  const onProfileSaved = (accountId: string, saved: IProfileResource) =>
    request.setData((previous) =>
      (previous ?? []).map((item) =>
        item.id === accountId
          ? { ...item, profiles: item.profiles.map((p) => (p.id === saved.id ? saved : p)) }
          : item,
      ),
    );

  const onProfileRemoved = (accountId: string, profileId: string) =>
    request.setData((previous) =>
      (previous ?? []).map((item) =>
        item.id === accountId
          ? { ...item, profiles: item.profiles.filter((p) => p.id !== profileId) }
          : item,
      ),
    );

  return {
    accounts: request.data ?? [],
    loading: request.loading,
    handler,
    onUpsert,
    onRemove,
    onProfileSaved,
    onProfileRemoved,
  };
};
