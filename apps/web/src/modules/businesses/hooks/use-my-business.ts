import type { ICurrentBusiness } from "@yiya/shared/businesses";

import { useRequest } from "@/common/hooks/use-request";
import { getMyBusinessRequest } from "@/modules/businesses/services/business.service";

/** El negocio de quien tiene la sesión. Si no tiene, el server explica por qué en el toast. */
export const useMyBusiness = () => {
  const request = useRequest<ICurrentBusiness>();

  const handler = (signal?: AbortSignal) =>
    request.handleRequest(() => getMyBusinessRequest(signal));

  return { business: request.data, loading: request.loading, handler };
};
