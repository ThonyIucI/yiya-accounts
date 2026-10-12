import { Input } from "@yiya/ui/components/input";
import { cn } from "@yiya/ui/lib/utils";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

interface ISolesInputProps extends ComponentProps<typeof Input> {
  isCompact?: boolean;
  isSaving?: boolean;
}

/** Campo de precio en soles: prefijo `S/`, teclado decimal y, si guarda, un spinner. */
export default function SolesInput({ isCompact = false, isSaving = false, className, ...props }: ISolesInputProps) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-semibold text-muted-foreground",
          isCompact ? "text-base" : "text-lg",
        )}
      >
        S/
      </span>
      <Input
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        className={cn("pr-9 pl-10 tabular-nums", isCompact && "h-11 text-base", className)}
        {...props}
      />
      {isSaving && (
        <Loader2
          aria-hidden
          className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none"
        />
      )}
    </div>
  );
}
