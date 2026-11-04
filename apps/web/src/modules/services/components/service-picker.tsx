import type { IServiceSummary } from "@yiya/shared/services";
import { cn } from "@yiya/ui/lib/utils";

import ServiceAvatar from "./service-avatar";

interface IServicePickerProps {
  services: IServiceSummary[];
  value: string;
  onChange: (serviceId: string) => void;
}

/**
 * Los servicios como una fila de logos con scroll horizontal, al lado de su label
 * (acordado 2026-11-04): en una lista de servicios el logo se reconoce antes que el nombre.
 * El elegido lleva un anillo de color y su nombre aparece en el label; el resto, en el
 * tooltip y para el lector de pantalla.
 */
export default function ServicePicker({ services, value, onChange }: IServicePickerProps) {
  const chosen = services.find((service) => service.id === value);

  return (
    <div className="flex items-center gap-3">
      <p className="shrink-0 font-heading font-bold text-foreground">
        Servicio
        {chosen && <span className="block text-xs font-semibold text-muted-foreground">{chosen.name}</span>}
      </p>
      {/* El padding deja ver el anillo del elegido, que si no lo corta el scroll. */}
      <div
        role="radiogroup"
        aria-label="Servicio"
        className="-my-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {services.map((service) => {
          const isChosen = service.id === value;
          return (
            <button
              key={service.id}
              type="button"
              role="radio"
              aria-checked={isChosen}
              title={service.name}
              onClick={() => onChange(service.id)}
              className={cn(
                "shrink-0 cursor-pointer rounded-xl transition-[transform,box-shadow,opacity] duration-150 ease-out active:scale-95",
                isChosen ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-70 hover:opacity-100",
              )}
            >
              <ServiceAvatar name={service.name} imageUrl={service.imageUrl} className="size-11" />
              <span className="sr-only">{service.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
