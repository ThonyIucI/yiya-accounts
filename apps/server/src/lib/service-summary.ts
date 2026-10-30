import { service } from "@yiya/db/schema/services";

/**
 * Las columnas de `IServiceSummary` para un `select` de Drizzle: el servicio dentro de una
 * cuenta, de un proveedor o de un alquiler sale siempre con la misma forma.
 */
export const SERVICE_SUMMARY_COLUMNS = {
  id: service.id,
  name: service.name,
  imageUrl: service.imageUrl,
};
