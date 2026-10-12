import type { IBusinessResource, ICurrentBusiness } from "@yiya/shared/businesses";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

import { useRequest } from "@/common/hooks/use-request";
import { useChooseBusiness } from "@/modules/businesses/hooks/use-choose-business";
import { useListBusinesses } from "@/modules/businesses/hooks/use-list-businesses";
import { getMyBusinessRequest } from "@/modules/businesses/services/business.service";

interface IActiveBusinessContext {
  /** Solo el superadmin cambia de negocio; para el resto el contexto queda vacío. */
  isEnabled: boolean;
  current: ICurrentBusiness | null;
  businesses: IBusinessResource[];
  isLoading: boolean;
  isChoosing: boolean;
  /**
   * Sube cada vez que el superadmin cambia de negocio. Las pantallas se montan con esta
   * `key`, así vuelven a pedir sus datos ya del negocio nuevo.
   */
  version: number;
  choose: (businessId: string) => Promise<boolean>;
  /** Vuelve a pedir la lista y el negocio actual (tras crear, renombrar o desactivar). */
  refresh: () => Promise<void>;
}

const DISABLED_CONTEXT: IActiveBusinessContext = {
  isEnabled: false,
  current: null,
  businesses: [],
  isLoading: false,
  isChoosing: false,
  version: 0,
  choose: async () => false,
  refresh: async () => {},
};

const ActiveBusinessContext = createContext<IActiveBusinessContext>(DISABLED_CONTEXT);

interface IActiveBusinessProviderProps {
  isEnabled: boolean;
  children: ReactNode;
}

/**
 * En qué negocio está trabajando el superadmin y la lista para cambiarlo. El negocio
 * elegido vive en el server: acá solo se lee y se pide cambiarlo.
 */
export function ActiveBusinessProvider({ isEnabled, children }: IActiveBusinessProviderProps) {
  const ListBusinesses = useListBusinesses();
  const Current = useRequest<ICurrentBusiness>();
  const ChooseBusiness = useChooseBusiness();
  const [version, setVersion] = useState(0);

  /*
    Sin negocios no se pide el actual: el server respondería «Todavía no hay negocios» y
    saldría un toast de error en cada carga, cuando el menú ya lo explica.
  */
  const load = async (signal?: AbortSignal) => {
    const businesses = await ListBusinesses.handler(signal);
    if (!businesses || businesses.length === 0) {
      Current.setData(() => null);
      return;
    }
    await Current.handleRequest(() => getMyBusinessRequest(signal));
  };

  useEffect(() => {
    if (!isEnabled) {
      return;
    }
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled]);

  const choose = async (businessId: string) => {
    const chosen = await ChooseBusiness.handler(businessId);
    if (!chosen) {
      return false;
    }
    Current.setData(() => chosen);
    setVersion((previous) => previous + 1);
    return true;
  };

  const value: IActiveBusinessContext = isEnabled
    ? {
        isEnabled,
        current: Current.data,
        businesses: ListBusinesses.businesses,
        isLoading: ListBusinesses.loading || Current.loading,
        isChoosing: ChooseBusiness.loading,
        version,
        choose,
        refresh: () => load(),
      }
    : DISABLED_CONTEXT;

  return <ActiveBusinessContext.Provider value={value}>{children}</ActiveBusinessContext.Provider>;
}

export const useActiveBusiness = () => useContext(ActiveBusinessContext);
