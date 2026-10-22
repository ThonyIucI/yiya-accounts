import { Skeleton } from "@yiya/ui/components/skeleton";
import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";

import Select, { type IOption } from "@/common/components/select";
import { useActiveBusiness } from "@/modules/businesses/context/active-business";

const INPUT_ID = "business-switcher";

interface IBusinessSwitcherProps {
  /** Al elegir otro negocio (en celular, para cerrar el menú). */
  onChosen?: () => void;
  /** Al ir a crear el primer negocio (en celular, para cerrar el menú). */
  onNavigate?: () => void;
}

/**
 * Select del menú lateral con el que el superadmin entra a otro negocio. Siempre hay uno
 * elegido; solo cuando todavía no existe ninguno se muestra cómo crear el primero.
 */
export default function BusinessSwitcher({ onChosen, onNavigate }: IBusinessSwitcherProps) {
  const ActiveBusiness = useActiveBusiness();
  const { businesses, current } = ActiveBusiness;

  if (ActiveBusiness.isLoading && !current) {
    return <Skeleton className="h-13 w-full rounded-xl" />;
  }

  if (businesses.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-4 py-3">
        <Store className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-foreground">Todavía no hay negocios</p>
          <Link to="/negocios" onClick={onNavigate} className="font-semibold text-primary">
            Crear el primero
          </Link>
        </div>
      </div>
    );
  }

  const options: IOption[] = businesses.map((business) => ({
    value: business.id,
    label: business.name,
    description: business.isActive ? undefined : "Desactivado",
  }));

  const handleChange = async (option: IOption | null) => {
    if (!option || option.value === current?.id) {
      return;
    }
    const isChosen = await ActiveBusiness.choose(option.value);
    if (isChosen) {
      onChosen?.();
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={INPUT_ID} className="text-sm font-semibold text-muted-foreground">
        Negocio
      </label>
      <Select
        inputId={INPUT_ID}
        options={options}
        value={options.find((option) => option.value === current?.id) ?? null}
        onChange={handleChange}
        isLoading={ActiveBusiness.isChoosing}
        isDisabled={ActiveBusiness.isChoosing}
        placeholder="Elige un negocio"
      />
      {current && !current.isActive && (
        <p className="text-sm font-semibold text-destructive">Este negocio está desactivado</p>
      )}
    </div>
  );
}
