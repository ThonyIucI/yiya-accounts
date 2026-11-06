import { Badge } from "@yiya/ui/components/badge";
import type { IServiceSummary } from "@yiya/shared/services";
import { cn } from "@yiya/ui/lib/utils";

import HorizontalScroller from "@/common/components/horizontal-scroller";

interface IServicePickerProps {
  services: IServiceSummary[];
  value: string;
  onChange: (serviceId: string) => void;
}

/**
 * Los servicios como **chips con su nombre** y scroll horizontal, como las categorías del
 * POS de id-pos (acordado 2026-11-04: con logos se confundían). El elegido en tono de marca,
 * el resto como texto. Las flechas y el scroll los pone `HorizontalScroller`.
 */
export default function ServicePicker({ services, value, onChange }: IServicePickerProps) {
  return (
    <HorizontalScroller
      role="radiogroup"
      label="Servicio"
      previousLabel="Ver servicios anteriores"
      nextLabel="Ver más servicios"
      className="gap-1"
    >
      {services.map((service) => {
        const isChosen = service.id === value;
        return (
          <Badge
            key={service.id}
            size="lg"
            color={isChosen ? "primary" : "neutral"}
            variant={isChosen ? "soft" : "ghost"}
            className={cn(
              "h-9 cursor-pointer px-3.5 transition-[transform,color,background-color] duration-150 ease-out active:scale-95",
              !isChosen && "hover:text-foreground",
            )}
            render={
              <button type="button" role="radio" aria-checked={isChosen} onClick={() => onChange(service.id)} />
            }
          >
            {service.name}
          </Badge>
        );
      })}
    </HorizontalScroller>
  );
}
