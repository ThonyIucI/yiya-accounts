import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import type { TBusinessRole } from "@yiya/shared/businesses";

import { user } from "./auth";

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/**
 * Negocio que alquila perfiles (el equivalente a `stores` de id-backend). Toda tabla del
 * dominio lleva `businessId`. No se borra: se desactiva, y sus usuarios dejan de entrar.
 */
export const business = sqliteTable("business", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * Quién entra a qué negocio y con qué rol. Un usuario pertenece a **un solo** negocio
 * (índice único en `userId`): así el negocio sale de la sesión sin tener que elegirlo.
 * Si algún día alguien administra dos, se quita ese índice y se agrega un selector.
 */
export const membership = sqliteTable(
  "membership",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").$type<TBusinessRole>().notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    uniqueIndex("membership_userId_uidx").on(table.userId),
    index("membership_businessId_idx").on(table.businessId),
  ],
);

export const businessRelations = relations(business, ({ many }) => ({
  memberships: many(membership),
}));

export const membershipRelations = relations(membership, ({ one }) => ({
  business: one(business, { fields: [membership.businessId], references: [business.id] }),
  user: one(user, { fields: [membership.userId], references: [user.id] }),
}));
