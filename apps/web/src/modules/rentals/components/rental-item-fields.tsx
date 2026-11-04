import { Button } from "@yiya/ui/components/button";
import { IconButton } from "@yiya/ui/components/icon-button";
import { Input } from "@yiya/ui/components/input";
import { Label } from "@yiya/ui/components/label";
import type { IAccountResource } from "@yiya/shared/accounts";
import { addMonths, isIsoDate } from "@yiya/shared/dates";
import { parseSoles, toSolesInput } from "@yiya/shared/money";
import type { IBusinessServiceResource } from "@yiya/shared/services";
import { Trash2, TriangleAlert } from "lucide-react";

import FieldError from "@/common/components/field-error";
import Select, { type IOption } from "@/common/components/select";
import {
  DEFAULT_RENTAL_MONTHS,
  type IRentalItemValues,
  RENTAL_MONTH_SHORTCUTS,
  type TRentalItemErrors,
  isOwing,
} from "@/modules/rentals/utils/rental-form";
import {
  type TProfileHolders,
  buildProfileOptions,
  findProfileOption,
} from "@/modules/rentals/utils/profile-options";
import SolesInput from "@/modules/services/components/soles-input";

interface IRentalItemFieldsProps {
  /** Prefijo de los `id`, para que dos perfiles del mismo formulario no choquen. */
  idPrefix: string;
  value: IRentalItemValues;
  errors?: TRentalItemErrors;
  serviceOptions: IOption[];
  services: IBusinessServiceResource[];
  accounts: IAccountResource[];
  holders: TProfileHolders;
  /** Sin esto no hay botón de quitar (al editar, o si es el único perfil). */
  onRemove?: () => void;
  onChange: (next: IRentalItemValues) => void;
}

const asErrors = (message?: string) => (message ? [{ message }] : []);

const monthsLabel = (months: number) => (months === 1 ? "1 mes" : `${months} meses`);

/**
 * Un perfil del alquiler (RF-02): servicio → perfil → precio y lo pagado → inicio y
 * vencimiento, con atajos de 1, 3, 6 y 12 meses. Si queda debiendo, la fecha en que se
 * comprometió a pagar (RF-07c).
 */
export default function RentalItemFields({
  idPrefix,
  value,
  errors = {},
  serviceOptions,
  services,
  accounts,
  holders,
  onRemove,
  onChange,
}: IRentalItemFieldsProps) {
  const profileGroups = value.serviceId ? buildProfileOptions(accounts, value.serviceId, holders) : [];
  const sharedWith = value.profileId ? (holders.get(value.profileId) ?? []) : [];

  /* Cambiar el servicio borra el perfil y llena el precio con el de venta del servicio. */
  const handleServiceChange = (serviceId: string) => {
    const chosen = services.find((item) => item.id === serviceId);
    const price = toSolesInput(chosen?.profilePrice ?? null);
    onChange({ ...value, serviceId, profileId: "", price, paidAmount: price });
  };

  /* Si lo pagado seguía al precio (pagó completo), sigue al precio nuevo. */
  const handlePriceChange = (price: string) =>
    onChange({
      ...value,
      price,
      paidAmount: parseSoles(value.paidAmount) === parseSoles(value.price) ? price : value.paidAmount,
    });

  /* Correr el inicio corre el vencimiento con la misma duración del atajo (o un mes). */
  const handleStartsOnChange = (startsOn: string) => {
    const months =
      RENTAL_MONTH_SHORTCUTS.find(
        (shortcut) => isIsoDate(value.startsOn) && value.expiresOn === addMonths(value.startsOn, shortcut),
      ) ?? DEFAULT_RENTAL_MONTHS;
    onChange({
      ...value,
      startsOn,
      expiresOn: isIsoDate(startsOn) ? addMonths(startsOn, months) : value.expiresOn,
    });
  };

  const applyMonths = (months: number) =>
    isIsoDate(value.startsOn) && onChange({ ...value, expiresOn: addMonths(value.startsOn, months) });

  return (
    <div className="space-y-4 rounded-2xl bg-muted/50 p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor={`${idPrefix}-service`}>Servicio</Label>
          <Select
            inputId={`${idPrefix}-service`}
            placeholder="Elige el servicio"
            options={serviceOptions}
            noOptionsMessage={() => "Activa un servicio en Servicios"}
            isInvalid={Boolean(errors.serviceId)}
            value={serviceOptions.find((option) => option.value === value.serviceId) ?? null}
            onChange={(option) => option && handleServiceChange(option.value)}
          />
          <FieldError errors={asErrors(errors.serviceId)} />
        </div>
        {onRemove && (
          <IconButton label="Quitar este perfil" tone="destructive" className="mt-7" onClick={onRemove}>
            <Trash2 />
          </IconButton>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-profile`}>Perfil</Label>
        <Select
          inputId={`${idPrefix}-profile`}
          placeholder={value.serviceId ? "Elige el perfil" : "Primero elige el servicio"}
          options={profileGroups}
          noOptionsMessage={() =>
            value.serviceId ? "No hay cuentas activas de este servicio" : "Primero elige el servicio"
          }
          isInvalid={Boolean(errors.profileId)}
          value={findProfileOption(profileGroups, value.profileId)}
          onChange={(option) => option && onChange({ ...value, profileId: option.value })}
        />
        {/* RF-06: compartir se permite, pero se avisa. */}
        {sharedWith.length > 0 && (
          <p className="flex items-start gap-1.5 text-sm text-orange">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            Este perfil ya lo tiene {sharedWith.join(", ")}. Lo vas a compartir.
          </p>
        )}
        <FieldError errors={asErrors(errors.profileId)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${idPrefix}-price`}>Precio</Label>
          <SolesInput
            id={`${idPrefix}-price`}
            aria-invalid={Boolean(errors.price)}
            value={value.price}
            onChange={(event) => handlePriceChange(event.target.value)}
          />
          <FieldError errors={asErrors(errors.price)} />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${idPrefix}-paid`}>Pagó</Label>
          <SolesInput
            id={`${idPrefix}-paid`}
            aria-invalid={Boolean(errors.paidAmount)}
            value={value.paidAmount}
            onChange={(event) => onChange({ ...value, paidAmount: event.target.value })}
          />
          <FieldError errors={asErrors(errors.paidAmount)} />
        </div>
      </div>

      {isOwing(value) && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-pay-by`}>Prometió pagar el (opcional)</Label>
          <Input
            id={`${idPrefix}-pay-by`}
            type="date"
            aria-invalid={Boolean(errors.payBy)}
            value={value.payBy}
            onChange={(event) => onChange({ ...value, payBy: event.target.value })}
          />
          <FieldError errors={asErrors(errors.payBy)} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${idPrefix}-starts-on`}>Inicio</Label>
          <Input
            id={`${idPrefix}-starts-on`}
            type="date"
            aria-invalid={Boolean(errors.startsOn)}
            value={value.startsOn}
            onChange={(event) => handleStartsOnChange(event.target.value)}
          />
          <FieldError errors={asErrors(errors.startsOn)} />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${idPrefix}-expires-on`}>Vencimiento</Label>
          <Input
            id={`${idPrefix}-expires-on`}
            type="date"
            min={isIsoDate(value.startsOn) ? value.startsOn : undefined}
            aria-invalid={Boolean(errors.expiresOn)}
            value={value.expiresOn}
            onChange={(event) => onChange({ ...value, expiresOn: event.target.value })}
          />
          <FieldError errors={asErrors(errors.expiresOn)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Duración">
        {RENTAL_MONTH_SHORTCUTS.map((months) => {
          const isCurrent = isIsoDate(value.startsOn) && value.expiresOn === addMonths(value.startsOn, months);
          return (
            <Button
              key={months}
              type="button"
              size="xs"
              variant={isCurrent ? "default" : "outline"}
              aria-pressed={isCurrent}
              onClick={() => applyMonths(months)}
            >
              {monthsLabel(months)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
