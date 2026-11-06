import { addMonths, isIsoDate } from "@yiya/shared/dates";
import { parseSoles, roundSoles, toSolesInput } from "@yiya/shared/money";
import { INVALID_DATE_MESSAGE } from "@yiya/shared/purchases";
import {
  type IRentalResource,
  RENTAL_INVALID_PAID_MESSAGE,
  RENTAL_PAID_OVER_PRICE_MESSAGE,
} from "@yiya/shared/rentals";
import { Button } from "@yiya/ui/components/button";
import { Input } from "@yiya/ui/components/input";
import { Label } from "@yiya/ui/components/label";
import { Switch } from "@yiya/ui/components/switch";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import FieldError from "@/common/components/field-error";
import Modal from "@/common/components/modal";
import { useRenewRental } from "@/modules/rentals/hooks/use-renew-rental";
import { monthsOf } from "@/modules/rentals/utils/rental-cart";
import { parsePaid } from "@/modules/rentals/utils/rental-form";
import ServiceAvatar from "@/modules/services/components/service-avatar";
import SolesInput from "@/modules/services/components/soles-input";

import RentalPeriodPicker, { type IRentalPeriod, exactMonthsOf } from "./rental-period-picker";

const PRICE_ERROR = "Escribe el monto en soles, por ejemplo 8.00.";

/**
 * El periodo que sigue: empieza el día que vencía y dura lo mismo que el anterior (Thony,
 * 2026-11-06). Si el anterior no era de meses exactos, se redondea a meses.
 */
const nextPeriodOf = (rental: IRentalResource): IRentalPeriod => {
  const months = exactMonthsOf(rental) ?? monthsOf(rental);
  return { startsOn: rental.expiresOn, expiresOn: addMonths(rental.expiresOn, months) };
};

/**
 * El monto sugerido: el precio mensual del anterior (con su descuento) por los meses nuevos.
 * Si renovaba 1 mes a S/ 8 y ahora va por 3, sugiere S/ 24.
 */
const suggestedPriceOf = (rental: IRentalResource, period: IRentalPeriod): number =>
  roundSoles((rental.price / monthsOf(rental)) * monthsOf(period));

interface IRentalRenewModalProps {
  /** El alquiler a renovar; `null` cierra la modal. */
  rental: IRentalResource | null;
  /** El nuevo, ya guardado: reemplaza al anterior en la lista. */
  onRenewed: (previous: IRentalResource, renewed: IRentalResource) => void;
  onClose: () => void;
}

/**
 * Renovar **una cuenta** del cliente (Thony, 2026-11-06): un botón por cada perfil alquilado,
 * aunque no esté vencido, y esta modal hace de confirmación. Arriba el logo y el correo; debajo
 * las fechas con `RentalPeriodPicker` (puede renovar esta vez por 3 meses; el inicio no va
 * antes del vencimiento anterior, para eso se edita el alquiler) y el monto, que se cambia
 * porque el precio puede variar. Por defecto «Pagó todo», como al alquilar; apagado, pide lo
 * que pagó y cuándo paga el resto (Thony, 2026-11-06: por si acaso).
 */
export default function RentalRenewModal({ rental, onRenewed, onClose }: IRentalRenewModalProps) {
  const RenewRental = useRenewRental();
  const [priceInput, setPriceInput] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);
  const [period, setPeriod] = useState<IRentalPeriod | null>(null);
  /* Escrito a mano: cambiar las fechas ya no lo toca. */
  const [isPriceTyped, setIsPriceTyped] = useState(false);
  const [isPaidFull, setIsPaidFull] = useState(true);
  const [paidInput, setPaidInput] = useState("");
  const [paidError, setPaidError] = useState<string | null>(null);
  const [payBy, setPayBy] = useState("");
  const [payByError, setPayByError] = useState<string | null>(null);

  useEffect(() => {
    if (rental) {
      setPriceInput(toSolesInput(rental.price));
      setPriceError(null);
      setIsPriceTyped(false);
      setPeriod(nextPeriodOf(rental));
      setIsPaidFull(true);
      setPaidInput("");
      setPaidError(null);
      setPayBy("");
      setPayByError(null);
    }
  }, [rental]);

  /** Lo que pagó y cuándo paga el resto, o el error de cada campo. */
  const paymentOf = (price: number) => {
    if (isPaidFull) {
      return { paidAmount: price, payBy: null };
    }
    const paid = parsePaid(paidInput);
    const paidMessage =
      paid === null ? RENTAL_INVALID_PAID_MESSAGE : paid > price ? RENTAL_PAID_OVER_PRICE_MESSAGE : null;
    const payByMessage = payBy && !isIsoDate(payBy) ? INVALID_DATE_MESSAGE : null;
    setPaidError(paidMessage);
    setPayByError(payByMessage);
    if (paid === null || paidMessage || payByMessage) {
      return null;
    }
    return { paidAmount: paid, payBy: paid < price ? payBy || null : null };
  };

  const handleConfirm = async () => {
    if (!rental || !period || RenewRental.loading) {
      return;
    }
    const price = parseSoles(priceInput);
    if (price === null) {
      setPriceError(PRICE_ERROR);
      return;
    }
    const payment = paymentOf(price);
    if (!payment) {
      return;
    }
    const renewed = await RenewRental.handler(rental.id, { price, ...payment, ...period });
    if (renewed) {
      onRenewed(rental, renewed);
      onClose();
    }
  };

  return (
    <Modal
      open={rental !== null}
      title={rental ? `Renovar ${rental.service.name}` : "Renovar"}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" size="lg" onClick={handleConfirm}>
            {RenewRental.loading && <Loader2 className="animate-spin motion-reduce:animate-none" />}
            Confirmar
          </Button>
        </>
      }
    >
      {rental && period && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <ServiceAvatar
              name={rental.service.name}
              imageUrl={rental.service.imageUrl}
              className="size-12 rounded-lg"
            />
            <div className="min-w-0">
              <p className="truncate font-heading font-semibold text-foreground">{rental.service.name}</p>
              <p className="truncate text-muted-foreground">
                {rental.account.email} · {rental.profile.name}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">Fechas</p>
            <RentalPeriodPicker
              value={period}
              minStartsOn={rental.expiresOn}
              onChange={(next) => {
                setPeriod(next);
                if (!isPriceTyped) {
                  setPriceInput(toSolesInput(suggestedPriceOf(rental, next)));
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            {/* Como en el carrito: el monto y, al lado, «Pagó todo». */}
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor="renew-price">Monto</Label>
                <SolesInput
                  id="renew-price"
                  isCompact
                  inputMode="decimal"
                  aria-invalid={priceError !== null}
                  value={priceInput}
                  onChange={(event) => {
                    setPriceInput(event.target.value);
                    setIsPriceTyped(true);
                    setPriceError(null);
                  }}
                />
              </div>
              <label className="flex shrink-0 cursor-pointer flex-col items-center gap-1 pt-5">
                <Switch checked={isPaidFull} onCheckedChange={setIsPaidFull} />
                <span className="text-xs font-semibold text-muted-foreground">Pagó todo</span>
              </label>
            </div>
            <FieldError errors={priceError ? [{ message: priceError }] : []} />
          </div>

          {!isPaidFull && (
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 space-y-1">
                <Label htmlFor="renew-paid">Pagó</Label>
                <SolesInput
                  id="renew-paid"
                  isCompact
                  inputMode="decimal"
                  aria-invalid={paidError !== null}
                  value={paidInput}
                  onChange={(event) => {
                    setPaidInput(event.target.value);
                    setPaidError(null);
                  }}
                />
                <FieldError errors={paidError ? [{ message: paidError }] : []} />
              </div>
              <div className="min-w-0 space-y-1">
                <Label htmlFor="renew-pay-by">Paga el (opcional)</Label>
                <Input
                  id="renew-pay-by"
                  type="date"
                  aria-invalid={payByError !== null}
                  value={payBy}
                  onChange={(event) => {
                    setPayBy(event.target.value);
                    setPayByError(null);
                  }}
                  className="h-11"
                />
                <FieldError errors={payByError ? [{ message: payByError }] : []} />
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
