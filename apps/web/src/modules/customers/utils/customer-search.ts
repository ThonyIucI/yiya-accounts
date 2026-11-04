import type { ICustomerResource } from "@yiya/shared/customers";

/**
 * Busca por nombre, por número (con o sin espacios), por usuario (con o sin «@») y en la
 * nota. `term` ya viene sin espacios en los bordes y en minúsculas. Lo usan el listado de
 * Clientes y el buscador del carrito de alquilar.
 */
export const matchesCustomerSearch = (customer: ICustomerResource, term: string): boolean => {
  const digits = term.replace(/\D/g, "");
  const username = term.replace(/^@/, "");
  const phone = customer.phone ? `${customer.phone.countryPrefix}${customer.phone.number}` : "";
  return (
    customer.name.toLowerCase().includes(term) ||
    (customer.note?.toLowerCase().includes(term) ?? false) ||
    (username.length > 0 && (customer.whatsappUsername?.toLowerCase().includes(username) ?? false)) ||
    (digits.length > 0 && phone.includes(digits))
  );
};

/** Si lo escrito parece un número (para llenar el número al crear desde el buscador). */
export const looksLikePhone = (term: string): boolean => /^\+?[\d\s-]{6,}$/.test(term.trim());
