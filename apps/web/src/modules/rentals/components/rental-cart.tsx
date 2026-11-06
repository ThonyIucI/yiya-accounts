import { Button } from "@yiya/ui/components/button";
import { Input } from "@yiya/ui/components/input";
import { Label } from "@yiya/ui/components/label";
import { Switch } from "@yiya/ui/components/switch";
import type { IAccountResource } from "@yiya/shared/accounts";
import { formatSoles } from "@yiya/shared/money";
import { Loader2, Plus, ShoppingBag, Trash2, Wallet } from "lucide-react";

import FieldError from "@/common/components/field-error";
import { FormSection } from "@/common/components/form-section";
import type { TRentalCart } from "@/modules/rentals/hooks/use-rental-cart";
import type { TProfileHolders } from "@/modules/rentals/utils/profile-options";
import SolesInput from "@/modules/services/components/soles-input";

import RentalCartLine from "./rental-cart-line";

const asErrors = (message?: string) => (message ? [{ message }] : []);

interface IRentalCartLinesProps {
  cart: TRentalCart;
  accountsById: Map<string, IAccountResource>;
  holders: TProfileHolders;
  /** Abre el detalle de la línea (la misma modal que el catálogo). */
  onOpenLine: (key: string) => void;
  /** Celular: abre el catálogo para elegir perfiles (en escritorio está siempre a la izquierda). */
  onBrowse?: () => void;
}

/**
 * Lo que va en el carrito, como la canasta de id-pos: «Carrito · 2» con «Vaciar» y un perfil
 * por línea. Va en el cuerpo que scrollea; el cobro (`RentalCartCheckout`) queda fijo abajo.
 */
export function RentalCartLines({ cart, accountsById, holders, onOpenLine, onBrowse }: IRentalCartLinesProps) {
  return (
    <FormSection
      icon={ShoppingBag}
      title={
        <>
          Carrito
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary tabular-nums">
            {cart.lines.length}
          </span>
        </>
      }
      action={
        cart.lines.length > 0 && (
          <Button type="button" variant="ghost" size="xs" className="text-destructive" onClick={cart.clear} style={{ fontWeight: 400 }}>
            <Trash2 />
            Vaciar
          </Button>
        )
      }
    >

      {cart.lines.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <ShoppingBag aria-hidden className="size-7 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-semibold text-foreground">El carrito está vacío</p>
          <p className="text-muted-foreground">
            {onBrowse ? "Elige los perfiles que va a alquilar." : "Toca una cuenta para agregar uno de sus perfiles."}
          </p>
          {onBrowse && (
            <Button type="button" variant='link'  className="mt-1" onClick={onBrowse}>
              <Plus />
              Elegir perfiles
            </Button>
          )}
          <FieldError errors={asErrors(cart.errors.lines)} />
        </div>
      ) : (
        <>
        <ul className="divide-y divide-border/60">
          {cart.lines.map((line, index) => {
            const account = accountsById.get(line.accountId);
            if (!account) {
              return null;
            }
            return (
              <RentalCartLine
                key={line.key}
                line={line}
                account={account}
                amount={cart.lineAmounts[index] ?? 0}
                holders={holders}
                onOpen={() => onOpenLine(line.key)}
                onRemove={() => cart.removeLine(line.key)}
              />
            );
          })}
        </ul>
        {onBrowse && (
          <Button type="button" variant="ghost" size="sm" className="w-full text-primary" onClick={onBrowse}>
            <Plus />
            Agregar más perfiles
          </Button>
        )}
        </>
      )}
    </FormSection>
  );
}

/**
 * El cobro, **en el cuerpo del formulario** (acordado 2026-11-04, como id-pos): un solo
 * total (lleno con el sugerido y editable), si pagó completo, cuánto pagó y cuándo paga.
 */
export function RentalCartPayment({ cart }: { cart: TRentalCart }) {
  return (
    <FormSection icon={Wallet} title="Cobro">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="rental-total">Total a cobrar</Label>
            {cart.isTotalTyped && cart.suggestedTotal > 0 && (
              <button
                type="button"
                onClick={cart.resetTotal}
                className="cursor-pointer text-xs font-semibold text-primary underline-offset-4 hover:underline"
              >
                Volver a {formatSoles(cart.suggestedTotal)}
              </button>
            )}
          </div>
          <SolesInput
            id="rental-total"
            isCompact
            aria-invalid={Boolean(cart.errors.total)}
            value={cart.totalInput}
            onChange={(event) => cart.setTotal(event.target.value)}
            className="font-heading font-semibold"
          />
        </div>
        <label className="flex shrink-0 cursor-pointer flex-col items-center gap-1 pt-5">
          <Switch checked={cart.isPaidFull} onCheckedChange={cart.setIsPaidFull} />
          <span className="text-xs font-semibold text-muted-foreground">Pagó todo</span>
        </label>
      </div>
      <FieldError errors={asErrors(cart.errors.total)} />

      {!cart.isPaidFull && (
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0 space-y-1">
            <Label htmlFor="rental-paid">Pagó</Label>
            <SolesInput
              id="rental-paid"
              isCompact
              aria-invalid={Boolean(cart.errors.paid)}
              value={cart.paidInput}
              onChange={(event) => cart.setPaidInput(event.target.value)}
            />
            <FieldError errors={asErrors(cart.errors.paid)} />
          </div>
          <div className="min-w-0 space-y-1">
            <Label htmlFor="rental-pay-by">Paga el (opcional)</Label>
            <Input
              id="rental-pay-by"
              type="date"
              aria-invalid={Boolean(cart.errors.payBy)}
              value={cart.payBy}
              onChange={(event) => cart.setPayBy(event.target.value)}
              className="h-11"
            />
            <FieldError errors={asErrors(cart.errors.payBy)} />
          </div>
        </div>
      )}
    </FormSection>
  );
}

interface IRentalCartActionsProps {
  isSubmitting: boolean;
  /** El total a cobrar; `null` si el carrito está vacío o el total no es válido. */
  total: number | null;
  onCancel: () => void;
  onSubmit: () => void;
}

/**
 * El pie: **solo** Cancelar y Alquilar (acordado 2026-11-04). Alquilar lleva el total
 * (Thony, 2026-11-06): es lo último que se mira antes de cobrar.
 */
export function RentalCartActions({ isSubmitting, total, onCancel, onSubmit }: IRentalCartActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="outline" size="lg" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="button" size="lg" onClick={onSubmit}>
        {isSubmitting && <Loader2 className="animate-spin motion-reduce:animate-none" />}
        Alquilar
        {total !== null && total > 0 && <span className="tabular-nums">· {formatSoles(total)}</span>}
      </Button>
    </div>
  );
}
