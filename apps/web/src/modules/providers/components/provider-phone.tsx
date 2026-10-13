import {
  type IPhone,
  countryOfPhone,
  formatInternationalPhone,
  whatsAppUrl,
} from "@yiya/shared/phones";
import { MessageCircle } from "lucide-react";

import CountryFlag from "@/common/components/country-flag";

interface IProviderPhoneProps {
  phone: IPhone | null;
}

/** El WhatsApp del proveedor como link: tocarlo abre el chat. Sin teléfono, «Sin WhatsApp». */
export default function ProviderPhone({ phone }: IProviderPhoneProps) {
  if (!phone) {
    return <span className="text-muted-foreground">Sin WhatsApp</span>;
  }

  return (
    <a
      href={whatsAppUrl(phone.countryPrefix, phone.number)}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="inline-flex min-w-0 items-center gap-2 font-semibold text-foreground hover:text-primary"
      aria-label={`Escribir por WhatsApp al ${formatInternationalPhone(phone.countryPrefix, phone.number)}`}
    >
      <CountryFlag country={countryOfPhone(phone.countryPrefix, phone.number)} />
      <span className="truncate tabular-nums">
        {formatInternationalPhone(phone.countryPrefix, phone.number)}
      </span>
      <MessageCircle className="size-4 shrink-0 text-primary" />
    </a>
  );
}
