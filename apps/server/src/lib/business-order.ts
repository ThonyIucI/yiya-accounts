import { business } from "@yiya/db/schema/businesses";
import { desc } from "drizzle-orm";

/**
 * Orden de la lista de negocios: el más nuevo primero. El `id` desempata los creados en el
 * mismo milisegundo. Lo usan la pantalla Negocios y `requireBusiness`, para que «el primero
 * de la lista» sea el mismo en los dos lados.
 */
export const BUSINESS_LIST_ORDER = [desc(business.createdAt), desc(business.id)] as const;
