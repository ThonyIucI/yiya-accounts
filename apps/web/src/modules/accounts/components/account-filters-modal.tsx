import { Button } from "@yiya/ui/components/button";
import { Label } from "@yiya/ui/components/label";
import { cn } from "@yiya/ui/lib/utils";

import Modal from "@/common/components/modal";
import Select, { type IOption } from "@/common/components/select";

export interface IAccountFilters {
  serviceId: string | null;
  providerId: string | null;
}

export const EMPTY_ACCOUNT_FILTERS: IAccountFilters = { serviceId: null, providerId: null };

export const countAccountFilters = (filters: IAccountFilters): number =>
  Number(filters.serviceId !== null) + Number(filters.providerId !== null);

interface IAccountFiltersModalProps {
  open: boolean;
  filters: IAccountFilters;
  serviceOptions: IOption[];
  providerOptions: IOption[];
  /** Cuántas cuentas quedan con estos filtros: lo dice el botón de cerrar. */
  resultCount: number;
  onChange: (filters: IAccountFilters) => void;
  onClose: () => void;
}

interface IAccountFilterSelectsProps {
  filters: IAccountFilters;
  serviceOptions: IOption[];
  providerOptions: IOption[];
  onChange: (filters: IAccountFilters) => void;
  /** En la barra de escritorio van sin etiqueta (la dice el placeholder) y uno al lado del otro. */
  isInline?: boolean;
}

/** Los dos selects de filtros (servicio y proveedor). Se aplican al elegir. */
export function AccountFilterSelects({
  filters,
  serviceOptions,
  providerOptions,
  onChange,
  isInline = false,
}: IAccountFilterSelectsProps) {
  const idPrefix = isInline ? "toolbar-filter" : "filter";
  const fields = [
    {
      id: `${idPrefix}-service`,
      label: "Servicio",
      placeholder: "Todos los servicios",
      options: serviceOptions,
      value: filters.serviceId,
      change: (value: string | null) => onChange({ ...filters, serviceId: value }),
    },
    {
      id: `${idPrefix}-provider`,
      label: "Proveedor",
      placeholder: "Todos los proveedores",
      options: providerOptions,
      value: filters.providerId,
      change: (value: string | null) => onChange({ ...filters, providerId: value }),
    },
  ];

  return fields.map((field) => (
    <div key={field.id} className={cn(isInline ? "w-56 shrink-0" : "space-y-2")}>
      {!isInline && <Label htmlFor={field.id}>{field.label}</Label>}
      <Select
        inputId={field.id}
        aria-label={isInline ? `Filtrar por ${field.label.toLowerCase()}` : undefined}
        placeholder={field.placeholder}
        isClearable
        options={field.options}
        value={field.options.find((option) => option.value === field.value) ?? null}
        onChange={(option) => field.change(option?.value ?? null)}
      />
    </div>
  ));
}

/**
 * Filtros de Cuentas **en el celular**, en su propia modal (acordado 2026-10-13): se aplican
 * al elegir, y el botón dice cuántas cuentas quedan. En escritorio van en la barra, al lado
 * del buscador (acordado 2026-10-22).
 */
export default function AccountFiltersModal({
  open,
  filters,
  serviceOptions,
  providerOptions,
  resultCount,
  onChange,
  onClose,
}: IAccountFiltersModalProps) {
  return (
    <Modal
      open={open}
      title="Filtros"
      width="sm"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onChange(EMPTY_ACCOUNT_FILTERS)}>
            Limpiar
          </Button>
          <Button type="button" onClick={onClose}>
            Ver {resultCount} {resultCount === 1 ? "cuenta" : "cuentas"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <AccountFilterSelects
          filters={filters}
          serviceOptions={serviceOptions}
          providerOptions={providerOptions}
          onChange={onChange}
        />
      </div>
    </Modal>
  );
}
