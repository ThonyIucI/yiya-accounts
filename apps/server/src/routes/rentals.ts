import { createDb } from "@yiya/db";
import { profile, streamingAccount } from "@yiya/db/schema/accounts";
import { customers } from "@yiya/db/schema/customers";
import { rentals } from "@yiya/db/schema/rentals";
import { service } from "@yiya/db/schema/services";
import { isIsoDate, todayInLima } from "@yiya/shared/dates";
import { hasAtMostTwoDecimals, roundSoles } from "@yiya/shared/money";
import { INVALID_DATE_MESSAGE } from "@yiya/shared/purchases";
import {
  type IRentalResource,
  RENTAL_ALREADY_RELEASED_MESSAGE,
  RENTAL_ALREADY_RENEWED_MESSAGE,
  RENTAL_EXPIRES_BEFORE_START_MESSAGE,
  RENTAL_INVALID_PAID_MESSAGE,
  RENTAL_MAX_ITEMS,
  RENTAL_NO_ITEMS_MESSAGE,
  RENTAL_PAID_OVER_PRICE_MESSAGE,
  RENTAL_RENEW_ENDS_TOO_SOON_MESSAGE,
  RENTAL_RENEW_STARTS_TOO_SOON_MESSAGE,
} from "@yiya/shared/rentals";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { TDb } from "../lib/account-queries";
import type { TAppEnv } from "../lib/app-env";
import { badRequest, conflict, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { ok } from "../lib/response";
import { SERVICE_SUMMARY_COLUMNS } from "../lib/service-summary";
import { validateJson } from "../lib/validator";
import { requireBusiness } from "../middleware/require-business";
import { requireAuth } from "../middleware/require-role";

export const RENTAL_ROUTES = {
  RENTALS: "/rentals",
  RENTAL: "/rentals/:id",
  RENEW: "/rentals/:id/renew",
} as const;

const RENTAL_NOT_FOUND = "No encontramos ese alquiler.";
const CUSTOMER_NOT_FOUND = "No encontramos ese cliente.";
const PROFILE_NOT_FOUND = "No encontramos ese perfil.";
const INACTIVE_ACCOUNT_MESSAGE = "Esa cuenta está desactivada: actívala o elige otro perfil.";
const NO_CHANGES_MESSAGE = "No hay cambios para guardar.";

const priceSchema = z
  .number("Escribe el precio en números.")
  .positive("El precio debe ser mayor a S/ 0.")
  .refine(hasAtMostTwoDecimals, "El precio solo puede tener hasta 2 decimales.")
  .transform(roundSoles);

const paidAmountSchema = z
  .number(RENTAL_INVALID_PAID_MESSAGE)
  .min(0, RENTAL_INVALID_PAID_MESSAGE)
  .refine(hasAtMostTwoDecimals, RENTAL_INVALID_PAID_MESSAGE)
  .transform(roundSoles);

const dateSchema = z.string(INVALID_DATE_MESSAGE).refine(isIsoDate, INVALID_DATE_MESSAGE);

const itemSchema = z
  .object({
    profileId: z.string("Elige el perfil."),
    price: priceSchema,
    paidAmount: paidAmountSchema,
    /* Vacío o `null` = no dio fecha. */
    payBy: dateSchema.nullable().optional(),
    startsOn: dateSchema,
    expiresOn: dateSchema,
  })
  .refine((item) => item.expiresOn >= item.startsOn, {
    message: RENTAL_EXPIRES_BEFORE_START_MESSAGE,
    path: ["expiresOn"],
  })
  .refine((item) => item.paidAmount <= item.price, {
    message: RENTAL_PAID_OVER_PRICE_MESSAGE,
    path: ["paidAmount"],
  });

const createRentalsSchema = z.object({
  customerId: z.string("Elige el cliente."),
  items: z
    .array(itemSchema, RENTAL_NO_ITEMS_MESSAGE)
    .min(1, RENTAL_NO_ITEMS_MESSAGE)
    .max(RENTAL_MAX_ITEMS, `Puedes alquilar hasta ${RENTAL_MAX_ITEMS} perfiles de una vez.`),
});

/* Lo que se cruza (inicio y vencimiento, pagado y precio) se compara con lo guardado en la ruta. */
const updateRentalSchema = z
  .object({
    profileId: z.string("Elige el perfil.").optional(),
    price: priceSchema.optional(),
    paidAmount: paidAmountSchema.optional(),
    payBy: dateSchema.nullable().optional(),
    startsOn: dateSchema.optional(),
    expiresOn: dateSchema.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: NO_CHANGES_MESSAGE,
  });

/*
  Renovar (RF-11): por defecto empieza el día que vencía el anterior; puede empezar después
  (volvió a los días), nunca antes: para eso se edita el alquiler (Thony, 2026-11-06). Sin
  `paidAmount` se da por pagado completo, como al alquilar; con «Pagó todo» apagado llega lo
  que pagó y, si quiere, cuándo paga el resto.
*/
const renewRentalSchema = z
  .object({
    price: priceSchema,
    paidAmount: paidAmountSchema.optional(),
    payBy: dateSchema.nullable().optional(),
    startsOn: dateSchema.optional(),
    expiresOn: dateSchema,
  })
  .refine((body) => body.paidAmount === undefined || body.paidAmount <= body.price, {
    message: RENTAL_PAID_OVER_PRICE_MESSAGE,
    path: ["paidAmount"],
  });

/**
 * Alquileres con su cliente, servicio, cuenta y perfil, lo que vence primero arriba. Solo los
 * abiertos: sin liberar ni renovar. Con `ids` (como mucho `RENTAL_MAX_ITEMS`), solo esos.
 */
const selectOpenRentals = (db: TDb, businessId: string, ids?: string[]) =>
  db
    .select({
      rental: rentals,
      customer: { id: customers.id, name: customers.name },
      service: SERVICE_SUMMARY_COLUMNS,
      account: { id: streamingAccount.id, email: streamingAccount.email },
      profile: { id: profile.id, name: profile.name, pin: profile.pin, position: profile.position },
    })
    .from(rentals)
    .innerJoin(customers, eq(customers.id, rentals.customerId))
    .innerJoin(profile, eq(profile.id, rentals.profileId))
    .innerJoin(streamingAccount, eq(streamingAccount.id, profile.accountId))
    .innerJoin(service, eq(service.id, streamingAccount.serviceId))
    .where(
      and(
        eq(rentals.businessId, businessId),
        isNull(rentals.releasedOn),
        isNull(rentals.renewedById),
        ids ? inArray(rentals.id, ids) : undefined,
      ),
    )
    .orderBy(asc(rentals.expiresOn));

type TRentalRow = Awaited<ReturnType<typeof selectOpenRentals>>[number];

const toRentalResource = ({
  rental,
  customer,
  service: serviceRow,
  account,
  profile: profileRow,
}: TRentalRow): IRentalResource => ({
  id: rental.id,
  customer,
  service: serviceRow,
  account,
  profile: profileRow,
  price: rental.price,
  paidAmount: rental.paidAmount,
  paidOn: rental.paidOn,
  payBy: rental.payBy,
  startsOn: rental.startsOn,
  expiresOn: rental.expiresOn,
  createdAt: rental.createdAt.toISOString(),
});

/** Alquileres abiertos de **este** negocio, por id. */
const findOpenRentals = async (db: TDb, businessId: string, ids: string[]) =>
  (await selectOpenRentals(db, businessId, ids)).map(toRentalResource);

/**
 * Un alquiler abierto de **este** negocio. El de otro negocio da 404, como si no existiera;
 * uno ya renovado o liberado da 409, porque es historial y no se toca. Esa segunda lectura
 * solo pasa cuando no se encontró abierto.
 */
const findOpenRental = async (db: TDb, businessId: string, id: string) => {
  const [found] = await findOpenRentals(db, businessId, [id]);
  if (found) {
    return found;
  }
  const closed = await db
    .select({ renewedById: rentals.renewedById, releasedOn: rentals.releasedOn })
    .from(rentals)
    .where(and(eq(rentals.id, id), eq(rentals.businessId, businessId)))
    .get();
  if (closed?.renewedById) {
    throw conflict(RENTAL_ALREADY_RENEWED_MESSAGE);
  }
  if (closed?.releasedOn) {
    throw conflict(RENTAL_ALREADY_RELEASED_MESSAGE);
  }
  throw notFound(RENTAL_NOT_FOUND);
};

const assertCustomer = async (db: TDb, businessId: string, customerId: string) => {
  const row = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)))
    .get();
  if (!row) {
    throw notFound(CUSTOMER_NOT_FOUND);
  }
};

/*
  Los perfiles tienen que ser de este negocio y de cuentas activas. **No** se mira si ya
  están alquilados: un perfil se puede compartir (RF-05, acordado 2026-10-31). Devuelve la
  cuenta de cada perfil: el `account_id` sale de acá, nunca del request.
*/
const assertProfilesRentable = async (
  db: TDb,
  businessId: string,
  profileIds: string[],
): Promise<Map<string, string>> => {
  const uniqueIds = [...new Set(profileIds)];
  const rows = await db
    .select({ id: profile.id, accountId: profile.accountId, isActive: streamingAccount.isActive })
    .from(profile)
    .innerJoin(streamingAccount, eq(streamingAccount.id, profile.accountId))
    .where(and(eq(profile.businessId, businessId), inArray(profile.id, uniqueIds)));
  if (rows.length !== uniqueIds.length) {
    throw notFound(PROFILE_NOT_FOUND);
  }
  if (rows.some((row) => !row.isActive)) {
    throw badRequest(INACTIVE_ACCOUNT_MESSAGE);
  }
  return new Map(rows.map((row) => [row.id, row.accountId]));
};

/* Pagó algo: el día del pago es hoy. Sin pago, sin día. */
const paidOnFor = (paidAmount: number): string | null => (paidAmount > 0 ? todayInLima() : null);

/**
 * Alquileres del negocio en el que se está. El negocio sale de `requireBusiness`, nunca del
 * request, y quién lo registró sale de la sesión (RF-31). Ver docs/planes/04b-alquileres.md.
 */
export const rentalRoutes = new Hono<TAppEnv>()
  /* Abiertos, lo que vence primero arriba. El front los agrupa por cliente (RF-12). */
  .get(RENTAL_ROUTES.RENTALS, requireAuth, requireBusiness, async (context) => {
    const rows = await selectOpenRentals(createDb(), context.var.business.id);
    return ok(context, rows.map(toRentalResource));
  })

  /* Uno o varios perfiles para un cliente, de una vez. */
  .post(
    RENTAL_ROUTES.RENTALS,
    requireAuth,
    requireBusiness,
    validateJson(createRentalsSchema),
    async (context) => {
      const { customerId, items } = context.req.valid("json");
      const businessId = context.var.business.id;
      const db = createDb();

      await assertCustomer(db, businessId, customerId);
      const accountOf = await assertProfilesRentable(
        db,
        businessId,
        items.map((item) => item.profileId),
      );

      const values = items.map((item) => ({
        id: newId(),
        businessId,
        customerId,
        accountId: accountOf.get(item.profileId)!,
        profileId: item.profileId,
        price: item.price,
        paidAmount: item.paidAmount,
        paidOn: paidOnFor(item.paidAmount),
        /* La fecha prometida solo tiene sentido si queda debiendo. */
        payBy: item.paidAmount < item.price ? (item.payBy ?? null) : null,
        startsOn: item.startsOn,
        expiresOn: item.expiresOn,
        createdById: context.var.user.id,
      }));

      /*
        Un `insert` por alquiler dentro de un `batch` (una sola transacción): D1 acepta como
        mucho 100 parámetros por consulta, y un `insert` de 20 filas pasa de eso.
      */
      const [first, ...rest] = values.map((value) => db.insert(rentals).values(value));
      await db.batch([first!, ...rest]);

      return ok(
        context,
        await findOpenRentals(
          db,
          businessId,
          values.map((value) => value.id),
        ),
        201,
      );
    },
  )

  .patch(
    RENTAL_ROUTES.RENTAL,
    requireAuth,
    requireBusiness,
    validateJson(updateRentalSchema),
    async (context) => {
      const id = context.req.param("id");
      const body = context.req.valid("json");
      const businessId = context.var.business.id;
      const db = createDb();

      const current = await findOpenRental(db, businessId, id);
      /* Cambiar de perfil puede cambiar de cuenta: la cuenta sigue al perfil. */
      const newAccountId =
        body.profileId !== undefined && body.profileId !== current.profile.id
          ? (await assertProfilesRentable(db, businessId, [body.profileId])).get(body.profileId)
          : undefined;

      const startsOn = body.startsOn ?? current.startsOn;
      const expiresOn = body.expiresOn ?? current.expiresOn;
      if (expiresOn < startsOn) {
        throw badRequest(RENTAL_EXPIRES_BEFORE_START_MESSAGE);
      }
      const price = body.price ?? current.price;
      const paidAmount = body.paidAmount ?? current.paidAmount;
      if (paidAmount > price) {
        throw badRequest(RENTAL_PAID_OVER_PRICE_MESSAGE);
      }
      const isPaidChanged = body.paidAmount !== undefined && body.paidAmount !== current.paidAmount;
      const payBy = body.payBy !== undefined ? body.payBy : current.payBy;

      await db
        .update(rentals)
        .set({
          ...(body.profileId !== undefined && { profileId: body.profileId }),
          ...(newAccountId !== undefined && { accountId: newAccountId }),
          price,
          paidAmount,
          /* Un pago nuevo (o corregido) es de hoy (RF-07d). */
          ...(isPaidChanged && { paidOn: paidOnFor(paidAmount) }),
          payBy: paidAmount < price ? payBy : null,
          startsOn,
          expiresOn,
        })
        .where(and(eq(rentals.id, id), eq(rentals.businessId, businessId)));

      return ok(context, await findOpenRental(db, businessId, id));
    },
  )

  /*
    Renueva: crea el alquiler que sigue (mismo cliente y perfil, desde el vencimiento de este)
    y marca este como renovado, los dos en una transacción. Devuelve el nuevo; el front saca
    el anterior de la lista y pone este (RNF-08).
  */
  .post(
    RENTAL_ROUTES.RENEW,
    requireAuth,
    requireBusiness,
    validateJson(renewRentalSchema),
    async (context) => {
      const id = context.req.param("id");
      const body = context.req.valid("json");
      const businessId = context.var.business.id;
      const db = createDb();

      const current = await findOpenRental(db, businessId, id);
      const startsOn = body.startsOn ?? current.expiresOn;
      if (startsOn < current.expiresOn) {
        throw badRequest(RENTAL_RENEW_STARTS_TOO_SOON_MESSAGE);
      }
      if (body.expiresOn <= startsOn) {
        throw badRequest(RENTAL_RENEW_ENDS_TOO_SOON_MESSAGE);
      }
      /* La cuenta puede haberse desactivado desde que se alquiló. */
      const accountOf = await assertProfilesRentable(db, businessId, [current.profile.id]);

      const paidAmount = body.paidAmount ?? body.price;
      const renewedId = newId();
      await db.batch([
        db.insert(rentals).values({
          id: renewedId,
          businessId,
          customerId: current.customer.id,
          accountId: accountOf.get(current.profile.id)!,
          profileId: current.profile.id,
          price: body.price,
          paidAmount,
          paidOn: paidOnFor(paidAmount),
          payBy: paidAmount < body.price ? (body.payBy ?? null) : null,
          startsOn,
          expiresOn: body.expiresOn,
          createdById: context.var.user.id,
        }),
        db
          .update(rentals)
          .set({ renewedById: renewedId })
          .where(and(eq(rentals.id, id), eq(rentals.businessId, businessId))),
      ]);

      return ok(context, await findOpenRental(db, businessId, renewedId), 201);
    },
  )

  /* Uno mal cargado. Renovar y liberar no borran: dejan historial. */
  .delete(RENTAL_ROUTES.RENTAL, requireAuth, requireBusiness, async (context) => {
    const id = context.req.param("id");
    const businessId = context.var.business.id;
    const db = createDb();

    await findOpenRental(db, businessId, id);
    await db.delete(rentals).where(and(eq(rentals.id, id), eq(rentals.businessId, businessId)));

    return ok(context, { id });
  });
