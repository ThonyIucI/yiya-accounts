import { Badge } from "@yiya/ui/components/badge";
import { IconButton } from "@yiya/ui/components/icon-button";
import type { IServiceSummary } from "@yiya/shared/services";
import { cn } from "@yiya/ui/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/** Cuánto corre cada flecha: casi el ancho visible, para no saltarse chips. */
const SCROLL_RATIO = 0.8;
/** Margen en px para considerar que llegó al borde (evita flechas por redondeo). */
const EDGE_TOLERANCE = 2;

interface IServicePickerProps {
  services: IServiceSummary[];
  value: string;
  onChange: (serviceId: string) => void;
}

interface IScrollEdges {
  canLeft: boolean;
  canRight: boolean;
}

/**
 * Los servicios como **chips con su nombre** y scroll horizontal, como las categorías del
 * POS de id-pos (acordado 2026-11-04: con logos se confundían). El elegido en tono de marca,
 * el resto como texto. En escritorio, flechas a los lados cuando no entran todos; en
 * celular se desliza con el dedo.
 */
export default function ServicePicker({ services, value, onChange }: IServicePickerProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState<IScrollEdges>({ canLeft: false, canRight: false });

  const measure = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const canLeft = scroller.scrollLeft > EDGE_TOLERANCE;
    const canRight = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - EDGE_TOLERANCE;
    setEdges((previous) =>
      previous.canLeft === canLeft && previous.canRight === canRight ? previous : { canLeft, canRight },
    );
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [measure, services.length]);

  const scrollBy = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    scroller?.scrollBy({ left: direction * scroller.clientWidth * SCROLL_RATIO, behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-1">
      {edges.canLeft && (
        <IconButton label="Ver servicios anteriores" size="xs" className="hidden sm:flex" onClick={() => scrollBy(-1)}>
          <ChevronLeft />
        </IconButton>
      )}
      <div
        ref={scrollerRef}
        role="radiogroup"
        aria-label="Servicio"
        onScroll={measure}
        className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
      </div>
      {edges.canRight && (
        <IconButton label="Ver más servicios" size="xs" className="hidden sm:flex" onClick={() => scrollBy(1)}>
          <ChevronRight />
        </IconButton>
      )}
    </div>
  );
}
