import type { IOption } from "@/common/components/select";
import ServiceAvatar from "@/modules/services/components/service-avatar";

/**
 * Un servicio como opción de un select, **con su logo** (acordado 2026-10-13): en una lista
 * de servicios el logo se reconoce antes que el nombre.
 */
export const toServiceOption = (service: {
  id: string;
  name: string;
  imageUrl: string | null;
}): IOption => ({
  value: service.id,
  label: service.name,
  icon: (
    <ServiceAvatar
      name={service.name}
      imageUrl={service.imageUrl}
      className="size-7 rounded-lg text-sm"
    />
  ),
});
