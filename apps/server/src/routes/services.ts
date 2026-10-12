import { createDb } from "@yiya/db";
import { businessService, service } from "@yiya/db/schema/services";
import { hasAtMostTwoDecimals, roundSoles } from "@yiya/shared/money";
import {
  type IBusinessServiceResource,
  type ICatalogServiceResource,
  type IServiceResource,
  SERVICE_IMAGE_URL_MAX_LENGTH,
  SERVICE_MIN_PROFILES,
  SERVICE_NAME_MAX_LENGTH,
  SERVICE_NAME_MIN_LENGTH,
  toServiceNameKey,
} from "@yiya/shared/services";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { badRequest, conflict, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireBusiness } from "../middleware/require-business";
import { requireAuth, requireSuperadmin } from "../middleware/require-role";

export const SERVICE_ROUTES = {
  SERVICES: "/services",
  SERVICE: "/services/:id",
  BUSINESS_SERVICES: "/business-services",
  BUSINESS_SERVICE: "/business-services/:serviceId",
} as const;

const SERVICE_NOT_FOUND = "No encontramos ese servicio.";
const PROFILES_MESSAGE = "Los perfiles por cuenta deben ser un número entero desde 1.";
const IMAGE_URL_MESSAGE = "El link de la imagen debe empezar con https://.";
const NO_CHANGES_MESSAGE = "No hay cambios para guardar.";
const PRICES_BEFORE_ACTIVATING = "Pon el precio de compra y el de venta antes de activarlo.";
const ACTIVE_NEEDS_PRICES = "Un servicio activo necesita sus dos precios.";

const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const nameSchema = z
  .string("Escribe el nombre del servicio.")
  .trim()
  .min(SERVICE_NAME_MIN_LENGTH, "El nombre del servicio es demasiado corto.")
  .max(SERVICE_NAME_MAX_LENGTH, "El nombre del servicio es demasiado largo.");

const profilesSchema = z
  .number(PROFILES_MESSAGE)
  .int(PROFILES_MESSAGE)
  .min(SERVICE_MIN_PROFILES, PROFILES_MESSAGE);

/* Vacío o `null` = sin imagen (se muestra la inicial). */
const imageUrlSchema = z
  .string(IMAGE_URL_MESSAGE)
  .trim()
  .max(SERVICE_IMAGE_URL_MAX_LENGTH, "El link de la imagen es demasiado largo.")
  .refine((value) => value === "" || isHttpsUrl(value), IMAGE_URL_MESSAGE)
  .transform((value) => (value === "" ? null : value))
  .nullable();

/* `null` borra el precio (solo si el servicio no está activo). */
const priceSchema = z
  .number("Escribe el precio en números.")
  .positive("El precio debe ser mayor a S/ 0.")
  .refine(hasAtMostTwoDecimals, "El precio solo puede tener hasta 2 decimales.")
  .transform(roundSoles)
  .nullable();

const createServiceSchema = z.object({
  name: nameSchema,
  profilesPerAccount: profilesSchema,
  imageUrl: imageUrlSchema.optional(),
});

const updateServiceSchema = z
  .object({
    name: nameSchema.optional(),
    profilesPerAccount: profilesSchema.optional(),
    imageUrl: imageUrlSchema.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: NO_CHANGES_MESSAGE,
  });

const updateBusinessServiceSchema = z
  .object({
    isActive: z.boolean("Indica si el servicio está activo.").optional(),
    purchasePrice: priceSchema.optional(),
    profilePrice: priceSchema.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: NO_CHANGES_MESSAGE,
  });

type TDb = ReturnType<typeof createDb>;
type TServiceRow = typeof service.$inferSelect;

const toServiceResource = (row: TServiceRow): IServiceResource => ({
  id: row.id,
  name: row.name,
  profilesPerAccount: row.profilesPerAccount,
  imageUrl: row.imageUrl,
  createdAt: row.createdAt.toISOString(),
});

/** El catálogo con en cuántos negocios está activo cada servicio. Con `id`, solo ese. */
const selectCatalog = (db: TDb, id?: string) =>
  db
    .select({ service, activeInCount: sql<number>`count(${businessService.id})` })
    .from(service)
    .leftJoin(
      businessService,
      and(eq(businessService.serviceId, service.id), eq(businessService.isActive, true)),
    )
    .where(id ? eq(service.id, id) : undefined)
    .groupBy(service.id)
    .orderBy(service.nameKey);

const findCatalogService = async (db: TDb, id: string): Promise<ICatalogServiceResource> => {
  const [row] = await selectCatalog(db, id);
  if (!row) {
    throw notFound(SERVICE_NOT_FOUND);
  }
  return { ...toServiceResource(row.service), activeInCount: row.activeInCount };
};

/** Todo el catálogo, con lo que tiene **este** negocio de cada servicio. */
const selectBusinessServices = (db: TDb, businessId: string, serviceId?: string) =>
  db
    .select({
      service,
      isActive: businessService.isActive,
      purchasePrice: businessService.purchasePrice,
      profilePrice: businessService.profilePrice,
    })
    .from(service)
    .leftJoin(
      businessService,
      and(eq(businessService.serviceId, service.id), eq(businessService.businessId, businessId)),
    )
    .where(serviceId ? eq(service.id, serviceId) : undefined)
    .orderBy(service.nameKey);

type TBusinessServiceRow = Awaited<ReturnType<typeof selectBusinessServices>>[number];

/* Sin fila en `business_service`, el servicio está inactivo y sin precios. */
const toBusinessServiceResource = (row: TBusinessServiceRow): IBusinessServiceResource => ({
  ...toServiceResource(row.service),
  isActive: row.isActive ?? false,
  purchasePrice: row.purchasePrice,
  profilePrice: row.profilePrice,
});

/** No puede haber dos servicios con el mismo nombre, sin importar mayúsculas ni espacios. */
const assertNameAvailable = async (db: TDb, name: string, exceptId?: string) => {
  const existing = await db
    .select({ id: service.id, name: service.name })
    .from(service)
    .where(eq(service.nameKey, toServiceNameKey(name)))
    .get();
  if (existing && existing.id !== exceptId) {
    throw conflict(`Ya existe el servicio «${existing.name}».`);
  }
};

/**
 * Servicios.
 * - `/services`: el catálogo global. Solo el superadmin lo ve completo, crea y edita.
 * - `/business-services`: el catálogo dentro del negocio en el que se está (el del dueño o
 *   el que eligió el superadmin): si lo trabaja y sus dos precios. El negocio sale de
 *   `requireBusiness`, nunca del request.
 */
export const serviceRoutes = new Hono<TAppEnv>()
  .get(SERVICE_ROUTES.SERVICES, requireSuperadmin, async (context) => {
    const rows = await selectCatalog(createDb());
    return ok(
      context,
      rows.map(
        (row): ICatalogServiceResource => ({
          ...toServiceResource(row.service),
          activeInCount: row.activeInCount,
        }),
      ),
    );
  })

  .post(
    SERVICE_ROUTES.SERVICES,
    requireSuperadmin,
    validateJson(createServiceSchema),
    async (context) => {
      const { name, profilesPerAccount, imageUrl } = context.req.valid("json");
      const db = createDb();

      await assertNameAvailable(db, name);

      const id = newId();
      await db.insert(service).values({
        id,
        name,
        nameKey: toServiceNameKey(name),
        profilesPerAccount,
        imageUrl: imageUrl ?? null,
      });

      return ok(context, await findCatalogService(db, id), 201);
    },
  )

  .patch(
    SERVICE_ROUTES.SERVICE,
    requireSuperadmin,
    validateJson(updateServiceSchema),
    async (context) => {
      const id = context.req.param("id");
      const { name, ...changes } = context.req.valid("json");
      const db = createDb();

      if (name !== undefined) {
        await assertNameAvailable(db, name, id);
      }

      const updated = await db
        .update(service)
        .set({ ...changes, ...(name !== undefined && { name, nameKey: toServiceNameKey(name) }) })
        .where(eq(service.id, id))
        .returning({ id: service.id });
      if (updated.length === 0) {
        throw notFound(SERVICE_NOT_FOUND);
      }

      return ok(context, await findCatalogService(db, id));
    },
  )

  .get(SERVICE_ROUTES.BUSINESS_SERVICES, requireAuth, requireBusiness, async (context) => {
    const rows = await selectBusinessServices(createDb(), context.var.business.id);
    return ok(context, rows.map(toBusinessServiceResource));
  })

  .patch(
    SERVICE_ROUTES.BUSINESS_SERVICE,
    requireAuth,
    requireBusiness,
    validateJson(updateBusinessServiceSchema),
    async (context) => {
      const serviceId = context.req.param("serviceId");
      const changes = context.req.valid("json");
      const businessId = context.var.business.id;
      const db = createDb();

      const [row] = await selectBusinessServices(db, businessId, serviceId);
      if (!row) {
        throw notFound(SERVICE_NOT_FOUND);
      }
      const current = toBusinessServiceResource(row);

      const next = {
        isActive: changes.isActive ?? current.isActive,
        purchasePrice:
          changes.purchasePrice !== undefined ? changes.purchasePrice : current.purchasePrice,
        profilePrice:
          changes.profilePrice !== undefined ? changes.profilePrice : current.profilePrice,
      };

      /* Activo solo con los dos precios: al activarlo, o al vaciar un precio de uno activo. */
      if (next.isActive && (next.purchasePrice === null || next.profilePrice === null)) {
        throw badRequest(changes.isActive ? PRICES_BEFORE_ACTIVATING : ACTIVE_NEEDS_PRICES);
      }

      await db
        .insert(businessService)
        .values({ id: newId(), businessId, serviceId, ...next })
        .onConflictDoUpdate({
          target: [businessService.businessId, businessService.serviceId],
          set: { ...next, updatedAt: new Date() },
        });

      const [saved] = await selectBusinessServices(db, businessId, serviceId);
      return ok(context, toBusinessServiceResource(saved!));
    },
  );
