import { formatSoles } from "@yiya/shared/money";
import { Badge } from "@yiya/ui/components/badge";

import { type IRentalDue, dueColorOf } from "@/modules/rentals/utils/rental-groups";

/**
 * Lo que toca cobrarle al cliente (RF-13b, acordado 2026-11-04): **el badge es el monto**,
 * con el color del estado; la frase («Vence en 2 días», «Debe») va en el tooltip y para el
 * lector de pantalla. Al día no se dibuja.
 */
export default function RentalDueBadge({ due }: { due: IRentalDue | null }) {
  if (!due) {
    return null;
  }

  return (
    <Badge color={dueColorOf(due.status)} title={due.description} className="tabular-nums">
      {formatSoles(due.amount)}
      <span className="sr-only">: {due.description}</span>
    </Badge>
  );
}
