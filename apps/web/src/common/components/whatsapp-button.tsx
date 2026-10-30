import { type IPhone, toFullPhone, whatsAppUrl } from "@yiya/shared/phones";
import { iconButtonVariants } from "@yiya/ui/components/icon-button";

import WhatsAppIcon from "@/common/components/icons/whatsapp-icon";

interface IWhatsAppButtonProps {
  phone: IPhone | null;
  isBordered?: boolean;
}

/**
 * Abre el chat de WhatsApp, en el lugar donde cuentas tiene «enviar»: verde, al lado del
 * `⋯` (acordado 2026-10-30). Es lo único que abre el chat; tocar el número no. Sin número,
 * no se muestra.
 */
export default function WhatsAppButton({ phone, isBordered = false }: IWhatsAppButtonProps) {
  if (!phone) {
    return null;
  }

  const fullPhone = toFullPhone(phone.countryPrefix, phone.number);

  return (
    <a
      href={whatsAppUrl(phone.countryPrefix, phone.number)}
      target="_blank"
      rel="noreferrer"
      title="Escribir por WhatsApp"
      aria-label={`Escribir por WhatsApp al ${fullPhone}`}
      className={iconButtonVariants({ tone: "success", isBordered, isFilled: !isBordered })}
      /* No abre la fila o la card que lo contiene. */
      onClick={(event) => event.stopPropagation()}
    >
      <WhatsAppIcon className="size-5" />
    </a>
  );
}
