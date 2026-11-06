import { formatSoles } from "@yiya/shared/money";
import { type IRentalResource, rentalDebt } from "@yiya/shared/rentals";

import { formatCompactDate } from "@/common/utils/format-date";

/**
 * Lo pagado en verde y lo que falta en amarillo, sin la palabra «pagado» (Thony, 2026-11-06).
 * Si no pagó nada, solo el monto en amarillo. Lo usan la card del perfil y su historial.
 */
export default function RentalAmount({ rental }: { rental: Pick<IRentalResource, "price" | "paidAmount" | "payBy"> }) {
  const debt = rentalDebt(rental);
  const debtTitle = rental.payBy ? `Debe · prometió pagar el ${formatCompactDate(rental.payBy)}` : "Debe";
  return (
    <>
      {rental.paidAmount > 0 && (
        <p className="truncate font-semibold text-success" title="Pagado">
          {formatSoles(rental.paidAmount)}
        </p>
      )}
      {debt > 0 && (
        <p className="truncate font-semibold text-yellow" title={debtTitle}>
          {formatSoles(debt)}
          <span className="sr-only"> por pagar</span>
        </p>
      )}
    </>
  );
}
