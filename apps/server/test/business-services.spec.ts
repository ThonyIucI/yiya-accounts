import { beforeAll, describe, expect, it } from "vitest";

import { patchJson, postJson, putJson, request, signIn, signInAsSuperadmin } from "./helpers";

interface IBody<TData> {
  success: boolean;
  data: TData;
  error: string | null;
}

interface IBusinessServiceData {
  id: string;
  name: string;
  isActive: boolean;
  purchasePrice: number | null;
  profilePrice: number | null;
}

interface ICatalogData {
  id: string;
  activeInCount: number;
}

const OWNER_A = { name: "Dueña A", email: "precios-a@test.local", password: "password123" };
const OWNER_B = { name: "Dueño B", email: "precios-b@test.local", password: "password123" };

describe("/business-services (servicios dentro de un negocio)", () => {
  let superadminCookie = "";
  let ownerACookie = "";
  let ownerBCookie = "";
  let businessAId = "";
  let netflixId = "";
  let disneyId = "";

  const createBusinessWithOwner = async (name: string, owner: typeof OWNER_A) => {
    const created = await postJson("/api/v1/users", owner, { cookie: superadminCookie });
    const ownerId = (await created.json<IBody<{ id: string }>>()).data.id;
    const response = await postJson("/api/v1/businesses", { name, ownerId }, { cookie: superadminCookie });
    return (await response.json<IBody<{ id: string }>>()).data.id;
  };

  const createService = async (name: string) => {
    const response = await postJson(
      "/api/v1/services",
      { name, profilesPerAccount: 5 },
      { cookie: superadminCookie },
    );
    return (await response.json<IBody<{ id: string }>>()).data.id;
  };

  const listFor = async (cookie: string) => {
    const response = await request("/api/v1/business-services", { headers: { cookie } });
    return (await response.json<IBody<IBusinessServiceData[]>>()).data;
  };

  const update = (serviceId: string, body: unknown, cookie = ownerACookie) =>
    patchJson(`/api/v1/business-services/${serviceId}`, body, { cookie });

  const errorOf = async (response: Response) => (await response.json<IBody<null>>()).error;

  beforeAll(async () => {
    superadminCookie = (await signInAsSuperadmin()).cookie;
    businessAId = await createBusinessWithOwner("Negocio A", OWNER_A);
    await createBusinessWithOwner("Negocio B", OWNER_B);
    netflixId = await createService("Netflix");
    disneyId = await createService("Disney+");
    ownerACookie = await signIn(OWNER_A.email, OWNER_A.password);
    ownerBCookie = await signIn(OWNER_B.email, OWNER_B.password);
  });

  it("el dueño ve todo el catálogo, inactivo y sin precios al principio", async () => {
    const services = await listFor(ownerACookie);

    expect(services.map((item) => item.name).sort()).toEqual(["Disney+", "Netflix"]);
    expect(services.every((item) => !item.isActive && item.purchasePrice === null)).toBe(true);
  });

  it("no se puede activar sin los dos precios", async () => {
    const response = await update(netflixId, { isActive: true, profilePrice: 7.5 });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("Pon el precio de compra y el de venta antes de activarlo.");
  });

  it("con los dos precios se activa", async () => {
    // Act
    await update(netflixId, { purchasePrice: 20 });
    const response = await update(netflixId, { profilePrice: 7.5, isActive: true });
    const netflix = (await listFor(ownerACookie)).find((item) => item.id === netflixId);

    // Assert
    expect(response.status).toBe(200);
    expect(netflix).toMatchObject({ purchasePrice: 20, profilePrice: 7.5, isActive: true });
  });

  it("no se puede vaciar un precio de un servicio activo", async () => {
    const response = await update(netflixId, { purchasePrice: null });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("Un servicio activo necesita sus dos precios.");
  });

  it.each([
    [7.555, "El precio solo puede tener hasta 2 decimales."],
    [0, "El precio debe ser mayor a S/ 0."],
    [-5, "El precio debe ser mayor a S/ 0."],
  ])("rechaza el precio %d", async (price, message) => {
    const response = await update(disneyId, { profilePrice: price });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe(message);
  });

  it("desactivar conserva los precios", async () => {
    // Act
    await update(netflixId, { isActive: false });
    const netflix = (await listFor(ownerACookie)).find((item) => item.id === netflixId);

    // Assert
    expect(netflix).toMatchObject({ isActive: false, purchasePrice: 20, profilePrice: 7.5 });
  });

  it("lo del negocio A no aparece en el negocio B", async () => {
    const netflixInB = (await listFor(ownerBCookie)).find((item) => item.id === netflixId);

    expect(netflixInB).toMatchObject({ isActive: false, purchasePrice: null, profilePrice: null });
  });

  it("el superadmin dentro del negocio A cambia un precio y el dueño de A lo ve", async () => {
    // Arrange
    await putJson("/api/v1/me/active-business", { businessId: businessAId }, { cookie: superadminCookie });

    // Act
    const response = await update(netflixId, { profilePrice: 8 }, superadminCookie);
    const netflix = (await listFor(ownerACookie)).find((item) => item.id === netflixId);

    // Assert
    expect(response.status).toBe(200);
    expect(netflix?.profilePrice).toBe(8);
  });

  it("activeInCount cuenta solo los negocios donde está activo", async () => {
    // Arrange
    await update(netflixId, { isActive: true });
    await update(disneyId, { purchasePrice: 25, profilePrice: 6 }, ownerBCookie);

    // Act
    const response = await request("/api/v1/services", { headers: { cookie: superadminCookie } });
    const catalog = (await response.json<IBody<ICatalogData[]>>()).data;

    // Assert
    expect(catalog.find((item) => item.id === netflixId)?.activeInCount).toBe(1);
    expect(catalog.find((item) => item.id === disneyId)?.activeInCount).toBe(0);
  });

  it("un servicio que no existe da 404", async () => {
    const response = await update("no-existe", { isActive: false });

    expect(response.status).toBe(404);
    expect(await errorOf(response)).toBe("No encontramos ese servicio.");
  });

  it("un PATCH sin cambios se rechaza", async () => {
    const response = await update(netflixId, {});

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("No hay cambios para guardar.");
  });
});
