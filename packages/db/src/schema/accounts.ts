import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { business } from "./businesses";
import { provider } from "./providers";
import { service } from "./services";

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/**
 * Una cuenta de streaming del negocio: el **acceso** (correo y contraseña). Las compras y
 * renovaciones con el proveedor irán en su propia tabla; los alquileres, en la del paso 4.
 *
 * Se llama `streaming_account` y no `account` porque `account` ya es de better-auth (las
 * cuentas de login de los usuarios, `schema/auth.ts`). Con el mismo nombre chocaban.
 */
export const streamingAccount = sqliteTable(
  "streaming_account",
  {
    id: text("id").primaryKey(),
    /* Si se borra el negocio, se van sus cuentas. */
    businessId: text("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    /* `restrict`: no se puede borrar un servicio que tiene cuentas. */
    serviceId: text("service_id")
      .notNull()
      .references(() => service.id, { onDelete: "restrict" }),
    /* `restrict`: no se puede borrar un proveedor que tiene cuentas. */
    providerId: text("provider_id")
      .notNull()
      .references(() => provider.id, { onDelete: "restrict" }),
    email: text("email").notNull(),
    /* `toAccountEmailKey(email)`: para que «Cuenta@Gmail.com » y «cuenta@gmail.com» choquen. */
    emailKey: text("email_key").notNull(),
    /* «v1:iv:cifrado» en base64 (`lib/account-password.ts`). Nunca la contraseña en claro. */
    passwordEncrypted: text("password_encrypted").notNull(),
    /* El switch: desactivada sigue en la lista, pero sus perfiles no se alquilan. */
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    /* La misma cuenta de un servicio una sola vez por negocio. También sirve para listar. */
    uniqueIndex("streamingAccount_business_service_emailKey_uidx").on(
      table.businessId,
      table.serviceId,
      table.emailKey,
    ),
    /* Contar rápido las cuentas de un proveedor (listado y bloqueo al eliminarlo). */
    index("streamingAccount_providerId_idx").on(table.providerId),
  ],
);

/** Un perfil de una cuenta: lo que se alquila. */
export const profile = sqliteTable(
  "profile",
  {
    id: text("id").primaryKey(),
    /* Toda tabla con datos de un negocio lo lleva; el paso 4 filtra perfiles sin join. */
    businessId: text("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    /* Su cuenta de streaming. Si se elimina la cuenta, se van sus perfiles. */
    accountId: text("account_id")
      .notNull()
      .references(() => streamingAccount.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /* 4 dígitos, opcional. No es secreto como la contraseña: el dueño se lo pasa al cliente. */
    pin: text("pin"),
    /* El orden dentro de la cuenta (P1, P2…). */
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  /* Listar los perfiles de una cuenta en orden. */
  (table) => [index("profile_account_position_idx").on(table.accountId, table.position)],
);

export const streamingAccountRelations = relations(streamingAccount, ({ one, many }) => ({
  business: one(business, { fields: [streamingAccount.businessId], references: [business.id] }),
  service: one(service, { fields: [streamingAccount.serviceId], references: [service.id] }),
  provider: one(provider, { fields: [streamingAccount.providerId], references: [provider.id] }),
  profiles: many(profile),
}));

export const profileRelations = relations(profile, ({ one }) => ({
  account: one(streamingAccount, {
    fields: [profile.accountId],
    references: [streamingAccount.id],
  }),
}));
