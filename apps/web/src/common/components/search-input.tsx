import { Input } from "@yiya/ui/components/input";
import { cn } from "@yiya/ui/lib/utils";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";

/** Campo de búsqueda de un listado: el `Input` de siempre con la lupa a la izquierda. */
export default function SearchInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
      />
      <Input type="search" className={cn("pl-12", className)} {...props} />
    </div>
  );
}
