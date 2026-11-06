import type { IServiceSummary } from "@yiya/shared/services";

import ServiceAvatar from "./service-avatar";

/* Más que esto no entra en media card de 320 px; el resto se resume en «+N». */
const MAX_VISIBLE = 4;

interface IServiceAvatarStackProps {
  services: IServiceSummary[];
}

/**
 * Los logos de varios servicios en círculos chicos, encimados (acordado 2026-10-30). El
 * nombre no se escribe: va en el tooltip y para el lector de pantalla. Sin servicios, «—».
 */
export default function ServiceAvatarStack({ services }: IServiceAvatarStackProps) {
  if (services.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visible = services.slice(0, MAX_VISIBLE);
  const hidden = services.slice(MAX_VISIBLE);

  return (
    <ul className="flex items-center -space-x-1.5 -mt-1">
      {visible.map((service) => (
        <li key={service.id} title={service.name} className="rounded-full ring-2 ring-card">
          <ServiceAvatar
            name={service.name}
            imageUrl={service.imageUrl}
            className="size-6 rounded-full bg-card text-xs"
          />
          <span className="sr-only">{service.name}</span>
        </li>
      ))}
      {hidden.length > 0 && (
        <li
          title={hidden.map((service) => service.name).join(", ")}
          className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-card"
        >
          +{hidden.length}
          <span className="sr-only">: {hidden.map((service) => service.name).join(", ")}</span>
        </li>
      )}
    </ul>
  );
}
