import type { ICustomerResource } from "@yiya/shared/customers";
import { countryOfPhone, formatNationalPhone, toFullPhone } from "@yiya/shared/phones";
import { formatWhatsAppUsername } from "@yiya/shared/whatsapp";
import { AtSign, CalendarDays, MessageSquareText, Pencil, Phone, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import CountryFlag from "@/common/components/country-flag";
import { DetailList, DetailRow, DetailSection } from "@/common/components/detail-section";
import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import SidePanel from "@/common/components/side-panel";
import WhatsAppButton from "@/common/components/whatsapp-button";
import { formatShortDate } from "@/common/utils/format-date";

interface ICustomerDetailPanelProps {
  /** El cliente abierto; `null` cierra el panel. */
  customer: ICustomerResource | null;
  onEdit: (customer: ICustomerResource) => void;
  onDelete: (customer: ICustomerResource) => void;
  onClose: () => void;
}

/**
 * Detalle lateral de un cliente, como el de cuentas: Datos (número y usuario de WhatsApp,
 * cada uno con su copiar, y desde cuándo es cliente) y Nota, el único lugar donde se ve.
 * Arriba, WhatsApp abre el chat y `⋯` edita o elimina. Desde el 4b suma sus alquileres.
 */
export default function CustomerDetailPanel({ customer, onEdit, onDelete, onClose }: ICustomerDetailPanelProps) {
  /* El panel se queda con el último cliente mientras se anima al cerrarse. */
  const [shown, setShown] = useState<ICustomerResource | null>(customer);

  useEffect(() => {
    if (customer) {
      setShown(customer);
    }
  }, [customer]);

  const current = customer ?? shown;

  const actions: IRowAction[] = current
    ? [
        { icon: Pencil, label: "Editar", onClick: () => onEdit(current) },
        { icon: Trash2, label: "Eliminar", variant: "destructive", onClick: () => onDelete(current) },
      ]
    : [];

  const phone = current?.phone ?? null;
  const country = phone ? countryOfPhone(phone.countryPrefix, phone.number) : null;
  const username = current?.whatsappUsername ? formatWhatsAppUsername(current.whatsappUsername) : null;

  return (
    <SidePanel
      open={customer !== null}
      label={current ? `Cliente ${current.name}` : "Cliente"}
      backLabel="Clientes"
      onClose={onClose}
      actions={
        current && (
          <>
            <WhatsAppButton phone={current.phone} username={current.whatsappUsername} />
            <RowActions actions={actions} />
          </>
        )
      }
    >
      {current && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <InitialsAvatar
              name={current.name}
              color={avatarColorOf(current.name)}
              className="size-14 text-lg"
            />
            <h2 className="min-w-0 truncate font-heading text-xl font-bold text-foreground">
              {current.name}
            </h2>
          </div>

          <DetailSection title="Datos">
            <DetailList>
              <DetailRow
                icon={Phone}
                label="Número"
                copy={
                  phone
                    ? {
                        label: "Copiar número",
                        successMessage: "Número copiado",
                        getText: () => toFullPhone(phone.countryPrefix, phone.number),
                      }
                    : undefined
                }
              >
                {phone && country && (
                  <span className="inline-flex items-center gap-2 tabular-nums">
                    <CountryFlag country={country} />
                    {formatNationalPhone(phone.number, country)}
                  </span>
                )}
              </DetailRow>
              <DetailRow
                icon={AtSign}
                label="Usuario"
                copy={
                  username
                    ? { label: "Copiar usuario", successMessage: "Usuario copiado", getText: () => username }
                    : undefined
                }
              >
                {username}
              </DetailRow>
              <DetailRow icon={CalendarDays} label="Cliente desde">
                {formatShortDate(current.createdAt)}
              </DetailRow>
            </DetailList>
          </DetailSection>

          <DetailSection title="Nota">
            <p className="flex items-start gap-2 text-sm">
              <MessageSquareText aria-hidden className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
              <span className={current.note ? "text-foreground" : "text-muted-foreground"}>
                {current.note ?? "No hay nota"}
              </span>
            </p>
          </DetailSection>
        </div>
      )}
    </SidePanel>
  );
}
