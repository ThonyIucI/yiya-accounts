import { cn } from "@yiya/ui/lib/utils";
import ReactSelect, { type Props as ReactSelectProps } from "react-select";

/* Igual que `Input` (`h-13`): todos los campos del formulario miden lo mismo. */
const CONTROL_HEIGHT = "3.25rem";
/* Por encima de la modal (z-50) y de la confirmación (z-60). */
const MENU_Z_INDEX = 70;

export interface IOption {
  value: string;
  label: string;
  /** Dato secundario en el menú, al costado del nombre (p. ej. el correo). */
  description?: string;
}

interface ISelectProps
  extends Omit<ReactSelectProps<IOption, false>, "className" | "classNames" | "unstyled"> {
  inputId?: string;
  isInvalid?: boolean;
}

/**
 * Select de la app sobre **react-select** (igual que en el saas): búsqueda al escribir,
 * teclado y lector de pantalla resueltos. El `<select>` nativo solo para listas cortas y
 * fijas; para datos que crecen (usuarios, clientes, cuentas) va este.
 *
 * El menú se monta en `document.body` para que una modal con scroll no lo recorte.
 */
export default function Select({ isInvalid, ...props }: ISelectProps) {
  return (
    <ReactSelect<IOption, false>
      unstyled
      menuPortalTarget={typeof document === "undefined" ? undefined : document.body}
      menuPlacement="auto"
      noOptionsMessage={() => "No hay opciones"}
      loadingMessage={() => "Cargando…"}
      /*
        Aun con `unstyled`, react-select inyecta con emotion su propio `min-height` (38 px) y
        pisa la clase de Tailwind. Las medidas que tienen que ganar van por `styles`.
      */
      styles={{
        control: (base) => ({ ...base, minHeight: CONTROL_HEIGHT }),
        menuPortal: (base) => ({ ...base, zIndex: MENU_Z_INDEX }),
      }}
      formatOptionLabel={(option, { context }) =>
        context === "menu" && option.description ? (
          /* Una sola línea: el dato secundario al costado, no debajo, para no inflar la fila. */
          <p className="truncate">
            <span className="font-semibold">{option.label}</span>
            <span className="text-muted-foreground"> · {option.description}</span>
          </p>
        ) : (
          option.label
        )
      }
      classNames={{
        control: ({ isFocused, isDisabled }) =>
          cn(
            "rounded-xl border-2 bg-card px-4 text-lg font-medium transition-colors",
            isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            isInvalid
              ? "border-destructive ring-4 ring-destructive/20"
              : isFocused
                ? "border-ring ring-4 ring-ring/30"
                : "border-input",
          ),
        valueContainer: () => "gap-1",
        placeholder: () => "font-normal text-muted-foreground",
        singleValue: () => "text-foreground",
        input: () => "text-foreground",
        indicatorsContainer: () => "gap-1",
        dropdownIndicator: ({ isFocused }) =>
          cn("transition-colors", isFocused ? "text-primary" : "text-muted-foreground"),
        clearIndicator: () => "text-muted-foreground hover:text-foreground",
        menu: () => "mt-2 overflow-hidden rounded-2xl bg-popover p-1.5 shadow-elevated",
        menuList: () => "max-h-64",
        option: ({ isFocused, isSelected }) =>
          cn(
            "cursor-pointer rounded-lg px-3 py-2.5 text-base",
            isSelected
              ? "bg-primary/10 font-semibold text-primary"
              : isFocused
                ? "bg-muted text-foreground"
                : "text-foreground",
          ),
        noOptionsMessage: () => "px-3 py-3 text-base text-muted-foreground",
        loadingMessage: () => "px-3 py-3 text-base text-muted-foreground",
      }}
      {...props}
    />
  );
}
