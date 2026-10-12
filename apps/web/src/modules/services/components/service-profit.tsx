import { formatSoles } from "@yiya/shared/money";
import { type IBusinessServiceResource, fullAccountProfit } from "@yiya/shared/services";
import { cn } from "@yiya/ui/lib/utils";

interface IServiceProfitProps {
  service: Pick<IBusinessServiceResource, "profilesPerAccount" | "purchasePrice" | "profilePrice">;
  className?: string;
}

/** Lo que deja una cuenta llena: «Cuenta llena: S/ 37.50 · ganancia S/ 17.50». */
export default function ServiceProfit({ service, className }: IServiceProfitProps) {
  const result = fullAccountProfit(service);

  if (!result) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Pon los dos precios para activarlo
      </p>
    );
  }

  return (
    <p className={cn("text-sm text-muted-foreground tabular-nums", className)}>
      Cuenta llena: {formatSoles(result.revenue)} · ganancia{" "}
      <span className={cn("font-bold", result.profit < 0 ? "text-destructive" : "text-primary")}>
        {formatSoles(result.profit)}
      </span>
    </p>
  );
}
