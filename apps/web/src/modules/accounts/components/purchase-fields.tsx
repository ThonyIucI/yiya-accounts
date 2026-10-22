import { Input } from "@yiya/ui/components/input";
import { Label } from "@yiya/ui/components/label";
import { addMonths, isIsoDate } from "@yiya/shared/dates";
import { DEFAULT_PURCHASE_MONTHS } from "@yiya/shared/purchases";

import FieldError from "@/common/components/field-error";
import type { IPurchaseFormValues, TPurchaseFormErrors } from "@/modules/accounts/utils/purchase-form";
import SolesInput from "@/modules/services/components/soles-input";

interface IPurchaseFieldsProps {
  /** Prefijo de los `id`, para que dos formularios abiertos no choquen. */
  idPrefix: string;
  value: IPurchaseFormValues;
  errors?: TPurchaseFormErrors;
  /** La ayuda bajo el precio, p. ej. «Referencial de Netflix: S/ 20.00». */
  priceHint?: string;
  onChange: (next: IPurchaseFormValues) => void;
  onBlur?: () => void;
}

const asErrors = (message?: string) => (message ? [{ message }] : []);

/**
 * Precio, fecha de compra y vencimiento (lado a lado). Cambiar la fecha de compra corre el
 * vencimiento a un mes después; el vencimiento se puede cambiar igual.
 */
export default function PurchaseFields({
  idPrefix,
  value,
  errors = {},
  priceHint,
  onChange,
  onBlur,
}: IPurchaseFieldsProps) {
  const handlePurchasedOnChange = (purchasedOn: string) =>
    onChange({
      ...value,
      purchasedOn,
      expiresOn: isIsoDate(purchasedOn)
        ? addMonths(purchasedOn, DEFAULT_PURCHASE_MONTHS)
        : value.expiresOn,
    });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-price`}>Precio de la compra</Label>
        <SolesInput
          id={`${idPrefix}-price`}
          aria-invalid={Boolean(errors.price)}
          value={value.price}
          onBlur={onBlur}
          onChange={(event) => onChange({ ...value, price: event.target.value })}
        />
        {priceHint && <p className="text-sm text-muted-foreground">{priceHint}</p>}
        <FieldError errors={asErrors(errors.price)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${idPrefix}-purchased-on`}>Fecha de compra</Label>
          <Input
            id={`${idPrefix}-purchased-on`}
            type="date"
            aria-invalid={Boolean(errors.purchasedOn)}
            value={value.purchasedOn}
            onBlur={onBlur}
            onChange={(event) => handlePurchasedOnChange(event.target.value)}
          />
          <FieldError errors={asErrors(errors.purchasedOn)} />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor={`${idPrefix}-expires-on`}>Vencimiento</Label>
          <Input
            id={`${idPrefix}-expires-on`}
            type="date"
            min={isIsoDate(value.purchasedOn) ? value.purchasedOn : undefined}
            aria-invalid={Boolean(errors.expiresOn)}
            value={value.expiresOn}
            onBlur={onBlur}
            onChange={(event) => onChange({ ...value, expiresOn: event.target.value })}
          />
          <FieldError errors={asErrors(errors.expiresOn)} />
        </div>
      </div>
    </div>
  );
}
