import { formatSoles, roundSoles } from "@yiya/shared/money";
import { type IPurchaseResource, accountExpiresOn } from "@yiya/shared/purchases";
import { CalendarClock, Pencil, Trash2, Wallet } from "lucide-react";

import { DetailList, DetailRow } from "@/common/components/detail-section";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { formatShortDate } from "@/common/utils/format-date";

import ExpiryDate from "./expiry-date";

interface IPurchaseListProps {
  /** La más nueva primero, como las trae el server. */
  purchases: IPurchaseResource[];
  onEdit: (purchase: IPurchaseResource) => void;
  onDelete: (purchase: IPurchaseResource) => void;
}

/**
 * Las compras de la cuenta en el detalle (RF-15d): el vencimiento y lo pagado en total
 * arriba, y debajo cada compra con sus fechas y su precio. La única que queda no se
 * elimina (se corrige).
 */
export default function PurchaseList({ purchases, onEdit, onDelete }: IPurchaseListProps) {
  if (purchases.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no tiene compras. Regístrala con «Renovar».</p>;
  }

  const total = roundSoles(purchases.reduce((sum, item) => sum + item.price, 0));
  const canDelete = purchases.length > 1;

  const actionsFor = (purchase: IPurchaseResource): IRowAction[] => [
    { icon: Pencil, label: "Corregir", onClick: () => onEdit(purchase) },
    ...(canDelete
      ? [
          {
            icon: Trash2,
            label: "Eliminar",
            variant: "destructive" as const,
            onClick: () => onDelete(purchase),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      <DetailList>
        <DetailRow icon={CalendarClock} label="Vence">
          <ExpiryDate expiresOn={accountExpiresOn(purchases)} />
        </DetailRow>
        <DetailRow icon={Wallet} label="Pagado en total">
          <span className="font-semibold tabular-nums">{formatSoles(total)}</span>
        </DetailRow>
      </DetailList>

      <ul className="divide-y divide-border/60 border-t border-border/60">
        {purchases.map((purchase) => (
          <li key={purchase.id} className="flex items-center gap-3 py-2 last:pb-0">
            <p className="min-w-0 flex-1 text-sm tabular-nums">
              <span className="text-foreground">{formatShortDate(purchase.purchasedOn)}</span>
              <span className="text-muted-foreground"> → {formatShortDate(purchase.expiresOn)}</span>
            </p>
            <span className="shrink-0 font-semibold tabular-nums">{formatSoles(purchase.price)}</span>
            <RowActions actions={actionsFor(purchase)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
