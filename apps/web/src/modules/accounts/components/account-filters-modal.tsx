import { Button } from "@yiya/ui/components/button";
import { Label } from "@yiya/ui/components/label";

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

/**
 * Filtros de Cuentas en su propia modal (acordado 2026-10-13): se aplican al elegir, y el
 * botón dice cuántas cuentas quedan.
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
        <div className="space-y-2">
          <Label htmlFor="filter-service">Servicio</Label>
          <Select
            inputId="filter-service"
            placeholder="Todos los servicios"
            isClearable
            options={serviceOptions}
            value={serviceOptions.find((option) => option.value === filters.serviceId) ?? null}
            onChange={(option) => onChange({ ...filters, serviceId: option?.value ?? null })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-provider">Proveedor</Label>
          <Select
            inputId="filter-provider"
            placeholder="Todos los proveedores"
            isClearable
            options={providerOptions}
            value={providerOptions.find((option) => option.value === filters.providerId) ?? null}
            onChange={(option) => onChange({ ...filters, providerId: option?.value ?? null })}
          />
        </div>
      </div>
    </Modal>
  );
}
