import { cn } from "@yiya/ui/lib/utils";

const MAX_INITIALS = 2;

/** «Yeremi Vil» → «YV»; «Alain» → «A». Las primeras letras de las dos primeras palabras. */
export const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, MAX_INITIALS)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

interface IInitialsAvatarProps {
  name: string;
  className?: string;
}

/**
 * Avatar de una persona (proveedor, cliente) con sus iniciales, en el color primario
 * (acordado 2026-10-30). Los clientes llevarán un color por nombre (paso 4a).
 */
export default function InitialsAvatar({ name, className }: IInitialsAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading font-extrabold text-primary",
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
