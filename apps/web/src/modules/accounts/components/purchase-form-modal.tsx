import { Button } from "@yiya/ui/components/button";
import type { IAccountResource } from "@yiya/shared/accounts";
import { formatSoles } from "@yiya/shared/money";
import type { IPurchaseResource } from "@yiya/shared/purchases";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import Modal from "@/common/components/modal";
import { useCreatePurchase, useUpdatePurchase } from "@/modules/accounts/hooks/use-purchases";
import {
  type TPurchaseFormErrors,
  buildRenewalValues,
  toPurchasePayload,
  toPurchaseValues,
  validatePurchaseValues,
} from "@/modules/accounts/utils/purchase-form";

import PurchaseFields from "./purchase-fields";

const FORM_ID = "purchase-form";

export interface IPurchaseFormTarget {
  account: IAccountResource;
  /** Sin compra: renovar (una compra nueva). Con compra: corregirla. */
  purchase?: IPurchaseResource;
}

interface IPurchaseFormModalProps {
  /** `null` cierra la modal. */
  target: IPurchaseFormTarget | null;
  /** El precio referencial del servicio de la cuenta, para una cuenta sin compras. */
  referencePrice: number | null;
  onSaved: (account: IAccountResource) => void;
  onClose: () => void;
}

const buildDefaults = (target: IPurchaseFormTarget | null, referencePrice: number | null) => ({
  purchase: target?.purchase
    ? toPurchaseValues(target.purchase)
    : target
      ? buildRenewalValues(target.account, referencePrice)
      : { price: "", purchasedOn: "", expiresOn: "" },
});

/**
 * Renovar una cuenta (RF-15a): viene con el precio de la compra anterior, la fecha de compra
 * en el vencimiento anterior y el vencimiento un mes después. También corrige una compra mal
 * cargada (RF-15d).
 */
export default function PurchaseFormModal({
  target,
  referencePrice,
  onSaved,
  onClose,
}: IPurchaseFormModalProps) {
  const CreatePurchase = useCreatePurchase();
  const UpdatePurchase = useUpdatePurchase();
  const isEdit = Boolean(target?.purchase);
  const [latest] = target?.account.purchases ?? [];

  const form = useForm({
    defaultValues: buildDefaults(target, referencePrice),
    onSubmit: async ({ value }) => {
      if (!target) {
        return;
      }
      const payload = toPurchasePayload(value.purchase);
      const saved = target.purchase
        ? await UpdatePurchase.handler(target.purchase.id, payload)
        : await CreatePurchase.handler(target.account.id, payload);
      if (saved) {
        onSaved(saved);
        onClose();
      }
    },
  });

  useEffect(() => {
    if (target) {
      form.reset(buildDefaults(target, referencePrice));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const priceHint =
    !isEdit && latest ? `La anterior costó ${formatSoles(latest.price)}.` : undefined;

  return (
    <Modal
      open={target !== null}
      title={isEdit ? "Corregir compra" : `Renovar ${target?.account.service.name ?? "cuenta"}`}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form={FORM_ID}>
                {isSubmitting && <Loader2 className="animate-spin motion-reduce:animate-none" />}
                {isEdit ? "Guardar cambios" : "Renovar"}
              </Button>
            )}
          </form.Subscribe>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          /* El botón nunca se apaga: un segundo clic mientras guarda no hace nada. */
          if (!form.state.isSubmitting) {
            form.handleSubmit();
          }
        }}
        className="space-y-4"
      >
        {target && <p className="text-sm text-muted-foreground">{target.account.email}</p>}

        <form.Field
          name="purchase"
          validators={{ onSubmit: ({ value }) => validatePurchaseValues(value) }}
        >
          {(field) => (
            <PurchaseFields
              idPrefix="purchase"
              value={field.state.value}
              errors={field.state.meta.errors[0] as TPurchaseFormErrors | undefined}
              priceHint={priceHint}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
      </form>
    </Modal>
  );
}
