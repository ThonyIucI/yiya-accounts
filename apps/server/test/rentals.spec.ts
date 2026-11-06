import { beforeAll, describe, expect, it } from "vitest";

import { patchJson, postJson, request, signIn, signInAsSuperadmin } from "./helpers";

interface IBody<TData> {
  success: boolean;
  data: TData;
  error: string | null;
}

interface IRentalData {
  id: string;
  customer: { id: string; name: string };
  service: { id: string; name: string };
  account: { id: string; email: string };
  profile: { id: string; name: string; position: number };
  price: number;
  paidAmount: number;
  paidOn: string | null;
  payBy: string | null;
  startsOn: string;
  expiresOn: string;
}

interface IAccountData {
  id: string;
  profiles: { id: string; position: number }[];
}

const OWNER_A = { name: "Dueña A", email: "alquileres-a@test.local", password: "password123" };
const OWNER_B = { name: "Dueño B", email: "alquileres-b@test.local", password: "password123" };
const PURCHASE = { price: 20, purchasedOn: "2026-11-01", expiresOn: "2026-12-01" };

/** Un perfil alquilado del 4 de noviembre al 4 de diciembre, pagado completo. */
const itemFor = (profileId: string, overrides: Record<string, unknown> = {}) => ({
  profileId,
  price: 15,
  paidAmount: 15,
  startsOn: "2026-11-04",
  expiresOn: "2026-12-04",
  ...overrides,
});

describe("/rentals", () => {
  let superadminCookie = "";
  let ownerACookie = "";
  let ownerBCookie = "";
  let netflixAccount: IAccountData;
  let disneyAccount: IAccountData;
  let maxAccount: IAccountData;
  let anaId = "";
  let luisId = "";
  let netflixId = "";
  let providerId = "";

  const createBusinessWithOwner = async (name: string, owner: typeof OWNER_A) => {
    const created = await postJson("/api/v1/users", owner, { cookie: superadminCookie });
    const ownerId = (await created.json<IBody<{ id: string }>>()).data.id;
    await postJson("/api/v1/businesses", { name, ownerId }, { cookie: superadminCookie });
  };

  const idOf = async (response: Response) => (await response.json<IBody<{ id: string }>>()).data.id;

  const createService = async (name: string) =>
    idOf(await postJson("/api/v1/services", { name, profilesPerAccount: 5 }, { cookie: superadminCookie }));

  const createAccount = async (serviceId: string, providerId: string, email: string, profileCount = 5) => {
    await patchJson(
      `/api/v1/business-services/${serviceId}`,
      { purchasePrice: 20, profilePrice: 15, isActive: true },
      { cookie: ownerACookie },
    );
    const response = await postJson(
      "/api/v1/accounts",
      { serviceId, providerId, email, password: "clave", profileCount, purchase: PURCHASE },
      { cookie: ownerACookie },
    );
    return (await response.json<IBody<IAccountData>>()).data;
  };

  const createCustomer = async (name: string, cookie = ownerACookie) =>
    idOf(await postJson("/api/v1/customers", { name }, { cookie }));

  const rent = (customerId: string, items: unknown[], cookie = ownerACookie) =>
    postJson("/api/v1/rentals", { customerId, items }, { cookie });

  const rentData = async (customerId: string, items: unknown[]) =>
    (await (await rent(customerId, items)).json<IBody<IRentalData[]>>()).data;

  const update = (id: string, body: unknown, cookie = ownerACookie) =>
    patchJson(`/api/v1/rentals/${id}`, body, { cookie });

  const renew = (id: string, body: unknown, cookie = ownerACookie) =>
    postJson(`/api/v1/rentals/${id}/renew`, body, { cookie });

  const release = (id: string, cookie = ownerACookie) =>
    postJson(`/api/v1/rentals/${id}/release`, {}, { cookie });

  const historyOf = async (customerId: string) =>
    (
      await (await request(`/api/v1/customers/${customerId}/rentals`, { headers: { cookie: ownerACookie } })).json<
        IBody<(IRentalData & { releasedOn: string | null; renewedById: string | null })[]>
      >()
    ).data;

  const remove = (path: string, cookie = ownerACookie) =>
    request(path, { method: "DELETE", headers: { cookie } });

  const listFor = async (cookie = ownerACookie) =>
    (await (await request("/api/v1/rentals", { headers: { cookie } })).json<IBody<IRentalData[]>>()).data;

  const errorOf = async (response: Response) => (await response.json<IBody<null>>()).error;

  const profileOf = (account: IAccountData, position: number) =>
    account.profiles.find((item) => item.position === position)!.id;

  beforeAll(async () => {
    superadminCookie = (await signInAsSuperadmin()).cookie;
    await createBusinessWithOwner("Negocio A", OWNER_A);
    await createBusinessWithOwner("Negocio B", OWNER_B);
    ownerACookie = await signIn(OWNER_A.email, OWNER_A.password);
    ownerBCookie = await signIn(OWNER_B.email, OWNER_B.password);

    providerId = await idOf(
      await postJson("/api/v1/providers", { name: "Proveedor" }, { cookie: ownerACookie }),
    );
    netflixId = await createService("Netflix");
    netflixAccount = await createAccount(netflixId, providerId, "netflix@test.local");
    disneyAccount = await createAccount(await createService("Disney+"), providerId, "disney@test.local");
    maxAccount = await createAccount(await createService("Max"), providerId, "max@test.local");
    anaId = await createCustomer("Ana");
    luisId = await createCustomer("Luis");
  });

  it("alquila 3 perfiles de servicios distintos a un cliente de una vez", async () => {
    // Act
    const response = await rent(anaId, [
      itemFor(profileOf(netflixAccount, 1)),
      itemFor(profileOf(disneyAccount, 1), { expiresOn: "2027-05-04", price: 80, paidAmount: 80 }),
      itemFor(profileOf(maxAccount, 1)),
    ]);
    const body = await response.json<IBody<IRentalData[]>>();

    // Assert
    expect(response.status).toBe(201);
    expect(body.data).toHaveLength(3);
    expect(body.data.every((rental) => rental.customer.id === anaId)).toBe(true);
    expect(body.data.map((rental) => rental.service.name).sort()).toEqual(["Disney+", "Max", "Netflix"]);
  });

  it("deja que dos clientes compartan el mismo perfil (RF-05)", async () => {
    // Arrange
    const sharedProfile = profileOf(netflixAccount, 2);
    await rent(anaId, [itemFor(sharedProfile)]);

    // Act
    const response = await rent(luisId, [itemFor(sharedProfile)]);

    // Assert
    expect(response.status).toBe(201);
  });

  it("deja más alquileres que perfiles en una cuenta", async () => {
    // Arrange
    const account = await createAccount(netflixId, providerId, "chica@test.local", 1);
    const onlyProfile = profileOf(account, 1);

    // Act
    const response = await rent(luisId, [itemFor(onlyProfile), itemFor(onlyProfile)]);

    // Assert
    expect(response.status).toBe(201);
  });

  it("guarda el día del pago y la fecha prometida solo si debe", async () => {
    // Act
    const [owing] = await rentData(luisId, [
      itemFor(profileOf(maxAccount, 2), { paidAmount: 5, payBy: "2026-11-10" }),
    ]);
    const [paid] = await rentData(luisId, [
      itemFor(profileOf(maxAccount, 3), { payBy: "2026-11-10" }),
    ]);

    // Assert
    expect(owing).toMatchObject({ paidAmount: 5, payBy: "2026-11-10" });
    expect(owing!.paidOn).not.toBeNull();
    expect(paid!.payBy).toBeNull();
  });

  it("rechaza un alquiler sin perfiles, con fechas al revés o pagado de más", async () => {
    // Act
    const empty = await rent(anaId, []);
    const reversed = await rent(anaId, [itemFor(profileOf(maxAccount, 4), { expiresOn: "2026-11-01" })]);
    const overpaid = await rent(anaId, [itemFor(profileOf(maxAccount, 4), { paidAmount: 20 })]);

    // Assert
    expect(empty.status).toBe(400);
    expect(await errorOf(empty)).toBe("Agrega al menos un perfil.");
    expect(reversed.status).toBe(400);
    expect(overpaid.status).toBe(400);
    expect(await errorOf(overpaid)).toBe("Lo pagado no puede ser más que el precio.");
  });

  it("no alquila perfiles de una cuenta desactivada", async () => {
    // Arrange
    await patchJson(`/api/v1/accounts/${maxAccount.id}`, { isActive: false }, { cookie: ownerACookie });

    // Act
    const response = await rent(anaId, [itemFor(profileOf(maxAccount, 5))]);

    // Assert
    expect(response.status).toBe(400);
    await patchJson(`/api/v1/accounts/${maxAccount.id}`, { isActive: true }, { cookie: ownerACookie });
  });

  it("lista los abiertos ordenados por vencimiento", async () => {
    // Arrange
    await rentData(luisId, [itemFor(profileOf(netflixAccount, 3), { expiresOn: "2026-11-05" })]);

    // Act
    const list = await listFor();

    // Assert
    const expirations = list.map((rental) => rental.expiresOn);
    expect(expirations).toEqual([...expirations].sort());
    expect(list[0]!.expiresOn).toBe("2026-11-05");
  });

  it("edita precio, pago y fechas, y valida contra lo guardado", async () => {
    // Arrange
    const [rental] = await rentData(anaId, [itemFor(profileOf(netflixAccount, 4))]);

    // Act
    const edited = await update(rental!.id, { price: 12, paidAmount: 6, payBy: "2026-11-20" });
    const reversed = await update(rental!.id, { startsOn: "2026-12-10" });
    const overpaid = await update(rental!.id, { paidAmount: 13 });

    // Assert
    expect(edited.status).toBe(200);
    expect((await edited.json<IBody<IRentalData>>()).data).toMatchObject({
      price: 12,
      paidAmount: 6,
      payBy: "2026-11-20",
    });
    expect(reversed.status).toBe(400);
    expect(overpaid.status).toBe(400);
  });

  it("al pagar todo, borra la fecha prometida", async () => {
    // Arrange
    const [rental] = await rentData(anaId, [
      itemFor(profileOf(netflixAccount, 5), { paidAmount: 5, payBy: "2026-11-20" }),
    ]);

    // Act
    const response = await update(rental!.id, { paidAmount: 15 });

    // Assert
    expect((await response.json<IBody<IRentalData>>()).data.payBy).toBeNull();
  });

  it("elimina un alquiler mal cargado", async () => {
    // Arrange
    const [rental] = await rentData(anaId, [itemFor(profileOf(disneyAccount, 2))]);

    // Act
    const response = await remove(`/api/v1/rentals/${rental!.id}`);

    // Assert
    expect(response.status).toBe(200);
    expect((await listFor()).some((item) => item.id === rental!.id)).toBe(false);
  });

  it("renueva desde el vencimiento anterior y el anterior sale del listado", async () => {
    // Arrange
    const [rental] = await rentData(luisId, [itemFor(profileOf(maxAccount, 3), { price: 10, paidAmount: 5 })]);

    // Act
    const response = await renew(rental!.id, { price: 12, expiresOn: "2027-01-04" });
    const renewed = (await response.json<IBody<IRentalData>>()).data;
    const list = await listFor();

    // Assert
    expect(response.status).toBe(201);
    expect(renewed.startsOn).toBe("2026-12-04");
    expect(renewed.expiresOn).toBe("2027-01-04");
    expect(renewed.profile.id).toBe(rental!.profile.id);
    expect(renewed.customer.id).toBe(luisId);
    expect(renewed.price).toBe(12);
    expect(renewed.paidAmount).toBe(12);
    expect(list.some((item) => item.id === rental!.id)).toBe(false);
    expect(list.some((item) => item.id === renewed.id)).toBe(true);
  });

  it("renueva por otro tiempo y desde unos días después del vencimiento", async () => {
    // Arrange
    const [rental] = await rentData(luisId, [itemFor(profileOf(maxAccount, 2))]);

    // Act
    const response = await renew(rental!.id, { price: 40, startsOn: "2026-12-10", expiresOn: "2027-03-10" });
    const renewed = (await response.json<IBody<IRentalData>>()).data;

    // Assert
    expect(response.status).toBe(201);
    expect(renewed.startsOn).toBe("2026-12-10");
    expect(renewed.expiresOn).toBe("2027-03-10");
  });

  it("renueva con una parte pagada y no acepta pagar más que el precio", async () => {
    // Arrange
    const [rental] = await rentData(luisId, [itemFor(profileOf(maxAccount, 1))]);

    // Act
    const overpaid = await renew(rental!.id, { price: 15, paidAmount: 20, expiresOn: "2027-01-04" });
    const response = await renew(rental!.id, {
      price: 15,
      paidAmount: 5,
      payBy: "2026-12-10",
      expiresOn: "2027-01-04",
    });
    const renewed = (await response.json<IBody<IRentalData>>()).data;

    // Assert
    expect(overpaid.status).toBe(400);
    expect(response.status).toBe(201);
    expect(renewed.paidAmount).toBe(5);
    expect(renewed.payBy).toBe("2026-12-10");
  });

  it("no renueva dos veces, ni edita lo renovado, ni termina antes del vencimiento", async () => {
    // Arrange
    const [rental] = await rentData(luisId, [itemFor(profileOf(maxAccount, 4))]);
    await renew(rental!.id, { price: 15, expiresOn: "2027-01-04" });
    const [other] = await rentData(luisId, [itemFor(profileOf(maxAccount, 5))]);

    // Act
    const again = await renew(rental!.id, { price: 15, expiresOn: "2027-02-04" });
    const edit = await update(rental!.id, { price: 1 });
    const tooSoon = await renew(other!.id, { price: 15, expiresOn: "2026-12-04" });
    const startsBefore = await renew(other!.id, { price: 15, startsOn: "2026-12-01", expiresOn: "2027-01-01" });

    // Assert
    expect(again.status).toBe(409);
    expect(await errorOf(again)).toBe("Este alquiler ya se renovó.");
    expect(edit.status).toBe(409);
    expect(tooSoon.status).toBe(400);
    expect(startsBefore.status).toBe(400);
  });

  it("libera: sale del listado, queda en el historial y no se libera dos veces", async () => {
    // Arrange
    const customerId = await createCustomer("Rosa");
    const [rental] = await rentData(customerId, [itemFor(profileOf(netflixAccount, 4))]);

    // Act
    const response = await release(rental!.id);
    const again = await release(rental!.id);
    const renewed = await renew(rental!.id, { price: 15, expiresOn: "2027-01-04" });
    const list = await listFor();
    const history = await historyOf(customerId);

    // Assert
    expect(response.status).toBe(200);
    expect(again.status).toBe(409);
    expect(await errorOf(again)).toBe("Este alquiler ya se liberó.");
    expect(renewed.status).toBe(409);
    expect(list.some((item) => item.id === rental!.id)).toBe(false);
    expect(history).toHaveLength(1);
    expect(history[0]!.releasedOn).not.toBeNull();
  });

  it("el historial de un cliente trae lo abierto y lo renovado, lo más nuevo arriba", async () => {
    // Arrange
    const customerId = await createCustomer("Pedro");
    const [first] = await rentData(customerId, [itemFor(profileOf(netflixAccount, 5))]);
    const renewedResponse = await renew(first!.id, { price: 15, expiresOn: "2027-01-04" });
    const renewed = (await renewedResponse.json<IBody<IRentalData>>()).data;

    // Act
    const history = await historyOf(customerId);

    // Assert
    expect(history.map((item) => item.id)).toEqual([renewed.id, first!.id]);
    expect(history[0]!.renewedById).toBeNull();
    expect(history[1]!.renewedById).toBe(renewed.id);
  });

  it("no elimina un cliente, una cuenta ni un perfil con alquileres", async () => {
    // Act
    const customer = await remove(`/api/v1/customers/${anaId}`);
    const account = await remove(`/api/v1/accounts/${disneyAccount.id}`);
    const profile = await remove(`/api/v1/profiles/${profileOf(disneyAccount, 1)}`);

    // Assert
    expect(customer.status).toBe(409);
    expect(await errorOf(customer)).toMatch(/^No puedes eliminar a «Ana»: tiene \d+ alquileres\.$/);
    expect(account.status).toBe(409);
    expect(profile.status).toBe(409);
  });

  it("el negocio B no ve ni toca los alquileres de A", async () => {
    // Arrange
    const [rental] = await rentData(anaId, [itemFor(profileOf(disneyAccount, 3))]);
    const otherCustomer = await createCustomer("Ana de B", ownerBCookie);

    // Act
    const list = await listFor(ownerBCookie);
    const edit = await update(rental!.id, { price: 1 }, ownerBCookie);
    const deleted = await remove(`/api/v1/rentals/${rental!.id}`, ownerBCookie);
    const renewed = await renew(rental!.id, { price: 15, expiresOn: "2027-01-04" }, ownerBCookie);
    const released = await release(rental!.id, ownerBCookie);
    const history = await request(`/api/v1/customers/${anaId}/rentals`, { headers: { cookie: ownerBCookie } });
    const foreignProfile = await rent(otherCustomer, [itemFor(profileOf(disneyAccount, 4))], ownerBCookie);
    const foreignCustomer = await rent(anaId, [itemFor(profileOf(disneyAccount, 4))], ownerBCookie);

    // Assert
    expect(list).toEqual([]);
    expect(edit.status).toBe(404);
    expect(deleted.status).toBe(404);
    expect(renewed.status).toBe(404);
    expect(released.status).toBe(404);
    expect(history.status).toBe(404);
    expect(foreignProfile.status).toBe(404);
    expect(foreignCustomer.status).toBe(404);
  });
});
