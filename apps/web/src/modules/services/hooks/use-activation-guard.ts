import type { IBusinessServiceResource } from "@yiya/shared/services";
import { useState } from "react";

const MISSING_PRICE_MESSAGE = "Pon el precio para activarlo";

/**
 * El switch no activa un servicio sin sus dos precios: en vez de llamar al server, marca el
 * campo que falta. El aviso se va solo en cuanto ese precio se guarda.
 */
export const useActivationGuard = (
  service: Pick<IBusinessServiceResource, "purchasePrice" | "profilePrice">,
  onToggleActive: (isActive: boolean) => void,
) => {
  const [isMissingShown, setIsMissingShown] = useState(false);
  const isPurchaseMissing = service.purchasePrice === null;
  const isProfileMissing = service.profilePrice === null;

  const handleToggle = (isActive: boolean) => {
    if (isActive && (isPurchaseMissing || isProfileMissing)) {
      setIsMissingShown(true);
      return;
    }
    setIsMissingShown(false);
    onToggleActive(isActive);
  };

  return {
    handleToggle,
    purchaseHint: isMissingShown && isPurchaseMissing ? MISSING_PRICE_MESSAGE : null,
    profileHint: isMissingShown && isProfileMissing ? MISSING_PRICE_MESSAGE : null,
  };
};
