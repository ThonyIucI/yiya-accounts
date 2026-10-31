import type { ICustomerResource } from "@yiya/shared/customers";
import { formatWhatsAppUsername } from "@yiya/shared/whatsapp";

import CopyButton from "@/common/components/copy-button";
import LongPressCopy from "@/common/components/long-press-copy";
import PhoneValue from "@/common/components/phone-value";

interface ICustomerWhatsAppValueProps {
  customer: ICustomerResource;
}

/**
 * El WhatsApp del cliente en la card y la tabla: el número con `PhoneValue`; si no tiene
 * número, «@usuario», que se copia igual (RF-04). Sin ninguno, «—».
 */
export default function CustomerWhatsAppValue({ customer }: ICustomerWhatsAppValueProps) {
  const { phone, whatsappUsername } = customer;
  if (phone || !whatsappUsername) {
    return <PhoneValue phone={phone} />;
  }

  const username = formatWhatsAppUsername(whatsappUsername);

  return (
    <span className="flex min-w-0 items-center gap-2">
      <CopyButton
        label={`Copiar el usuario ${username}`}
        getText={() => username}
        className="-ml-1.5 hidden md:inline-flex"
      />
      <LongPressCopy
        getText={() => username}
        successMessage="Usuario copiado"
        className="truncate font-semibold text-foreground"
      >
        {username}
      </LongPressCopy>
    </span>
  );
}
