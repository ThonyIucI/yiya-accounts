import { buttonVariants } from "@yiya/ui/components/button";
import {
  type IPhone,
  countryOfPhone,
  formatNationalPhone,
  toFullPhone,
  whatsAppUrl,
} from "@yiya/shared/phones";
import { cn } from "@yiya/ui/lib/utils";

import CopyButton from "@/common/components/copy-button";
import CountryFlag from "@/common/components/country-flag";
import WhatsAppIcon from "@/common/components/icons/whatsapp-icon";

interface IProviderPhoneProps {
  phone: IPhone | null;
}

/**
 * El WhatsApp del proveedor: bandera y número sin prefijo (la bandera ya dice el país),
 * copiar (el número completo, con prefijo) y el ícono de WhatsApp, que abre el chat.
 * Solo el ícono abre WhatsApp: tocar el número no hace nada, así no se abre sin querer.
 */
export default function ProviderPhone({ phone }: IProviderPhoneProps) {
  if (!phone) {
    return <span className="text-muted-foreground">Sin WhatsApp</span>;
  }

  const country = countryOfPhone(phone.countryPrefix, phone.number);
  const fullPhone = toFullPhone(phone.countryPrefix, phone.number);

  return (
    /* Frena el clic: la fila o la card que lo contiene no debe reaccionar. */
    <div className="flex min-w-0 items-center " onClick={(event) => event.stopPropagation()}>
      <div className="flex min-w-0 items-center gap-1">
        <CountryFlag country={country} />
        <span className="ml-1 truncate font-semibold text-foreground tabular-nums">
          {formatNationalPhone(phone.number, country)}
        </span>

        <CopyButton
          label={`Copiar el número ${fullPhone}`}
          size="lg"
          getText={() => fullPhone}
        />
      </div>

      <a
        href={whatsAppUrl(phone.countryPrefix, phone.number)}
        target="_blank"
        rel="noreferrer"
        title="Escribir por WhatsApp"
        aria-label={`Escribir por WhatsApp al ${fullPhone}`}
        /* Pegado al de copiar: los dos botones conservan su área táctil, solo se solapa el aire. */
        className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "-ml-2.5 text-primary")}
      >
        <WhatsAppIcon />
      </a>
    </div>
  );
}
