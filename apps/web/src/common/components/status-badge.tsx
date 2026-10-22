import Badge from "./badge";

interface IStatusBadgeProps {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

/** Estado en texto, no solo con el switch: el color nunca es el único indicador. */
export default function StatusBadge({
  isActive,
  activeLabel = "Activo",
  inactiveLabel = "Inactivo",
}: IStatusBadgeProps) {
  return (
    <Badge tone={isActive ? "primary" : "neutral"}>{isActive ? activeLabel : inactiveLabel}</Badge>
  );
}
