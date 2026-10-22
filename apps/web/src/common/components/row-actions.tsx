import { Button, buttonVariants } from "@yiya/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@yiya/ui/components/dropdown-menu";
import { cn } from "@yiya/ui/lib/utils";
import { type LucideIcon, MoreVertical } from "lucide-react";
import { Fragment } from "react";

export interface IRowAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  /** Botón de ícono suelto, siempre visible. Sin esto va al menú de tres puntos. */
  inline?: boolean;
  variant?: "default" | "destructive";
}

interface IRowActionsProps {
  actions: IRowAction[];
  /** Botones con borde, para la tabla de escritorio (acordado 2026-10-22). */
  isBordered?: boolean;
}

const BORDERED_CLASS = "border border-border bg-card";

/**
 * Acciones de una fila de tabla o de una card de listado (mismo patrón que el saas).
 * Frena el clic para que no abra el detalle de la fila que la contiene.
 */
export default function RowActions({ actions, isBordered = false }: IRowActionsProps) {
  const inlineActions = actions.filter((action) => action.inline);
  const menuActions = actions.filter((action) => !action.inline);

  return (
    <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
      {inlineActions.map(({ icon: Icon, label, onClick, variant }) => (
        <Button
          key={label}
          type="button"
          variant="ghost"
          size="icon-sm"
          title={label}
          aria-label={label}
          onClick={onClick}
          className={cn(
            isBordered && BORDERED_CLASS,
            variant === "destructive" && "hover:bg-destructive/10 hover:text-destructive",
          )}
        >
          <Icon />
        </Button>
      ))}

      {menuActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            title="Más acciones"
            aria-label="Más acciones"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), isBordered && BORDERED_CLASS)}
          >
            <MoreVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto">
            {menuActions.map(({ icon: Icon, label, onClick, variant }, index) => {
              const isFirstDestructive =
                variant === "destructive" && index > 0 && menuActions[index - 1]?.variant !== "destructive";

              return (
                <Fragment key={label}>
                  {isFirstDestructive && <DropdownMenuSeparator />}
                  <DropdownMenuItem variant={variant} onClick={onClick}>
                    <Icon />
                    {label}
                  </DropdownMenuItem>
                </Fragment>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
