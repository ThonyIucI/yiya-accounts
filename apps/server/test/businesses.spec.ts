import { beforeAll, describe, expect, it } from "vitest";

import { patchJson, postJson, request, signIn, signInAsSuperadmin } from "./helpers";

interface IBody<TData> {
  success: boolean;
  data: TData;
  error: string | null;
}

interface IBusinessData {
  id: string;
  name: string;
  isActive: boolean;
  owner: { id: string; email: string } | null;
}

const OWNER = { name: "Dueña Uno", email: "duena@test.local", password: "password123" };
const OTHER_OWNER = { name: "Dueño Dos", email: "dueno2@test.local", password: "password123" };
const NO_BUSINESS_USER = { name: "Sin Negocio", email: "sin@test.local", password: "password123" };

describe("/businesses", () => {
  let superadminCookie = "";
  let ownerId = "";
  let businessId = "";

  const createUser = async (payload: typeof OWNER) => {
    const response = await postJson("/api/v1/users", payload, { cookie: superadminCookie });
    return (await response.json<IBody<{ id: string }>>()).data.id;
  };

  const createBusiness = (body: unknown, cookie = superadminCookie) =>
    postJson("/api/v1/businesses", body, { cookie });

  beforeAll(async () => {
    superadminCookie = (await signInAsSuperadmin()).cookie;
    ownerId = await createUser(OWNER);
  });

  it("el superadmin crea un negocio con su dueño", async () => {
    // Act
    const response = await createBusiness({ name: "Streaming Ana", ownerId });
    const body = await response.json<IBody<IBusinessData>>();

    // Assert
    expect(response.status).toBe(201);
    expect(body.data.name).toBe("Streaming Ana");
    expect(body.data.isActive).toBe(true);
    expect(body.data.owner?.email).toBe(OWNER.email);
    businessId = body.data.id;
  });

  it("un usuario no puede ser dueño de dos negocios", async () => {
    const response = await createBusiness({ name: "Otro negocio", ownerId });
    const body = await response.json<IBody<null>>();

    expect(response.status).toBe(409);
    expect(body.error).toBe("Ese usuario ya es parte del negocio «Streaming Ana».");
  });

  it("rechaza un dueño que no existe", async () => {
    const response = await createBusiness({ name: "Fantasma", ownerId: "no-existe" });

    expect(response.status).toBe(404);
  });

  it("valida el nombre en español", async () => {
    const response = await createBusiness({ name: "A", ownerId });
    const body = await response.json<IBody<null>>();

    expect(response.status).toBe(400);
    expect(body.error).toBe("El nombre del negocio es demasiado corto.");
  });

  it("la lista muestra el negocio con su dueño, y el usuario aparece con su negocio", async () => {
    // Act
    const businesses = await request("/api/v1/businesses", { headers: { cookie: superadminCookie } });
    const users = await request("/api/v1/users", { headers: { cookie: superadminCookie } });
    const businessList = (await businesses.json<IBody<IBusinessData[]>>()).data;
    const userList = (await users.json<IBody<{ email: string; business: { name: string } | null }[]>>())
      .data;

    // Assert
    expect(businessList.find((item) => item.id === businessId)?.owner?.id).toBe(ownerId);
    expect(userList.find((item) => item.email === OWNER.email)?.business?.name).toBe("Streaming Ana");
  });

  it("el dueño ve su negocio pero no la administración de negocios", async () => {
    // Arrange
    const ownerCookie = await signIn(OWNER.email, OWNER.password);

    // Act
    const mine = await request("/api/v1/my-business", { headers: { cookie: ownerCookie } });
    const list = await request("/api/v1/businesses", { headers: { cookie: ownerCookie } });
    const create = await createBusiness({ name: "Intruso", ownerId }, ownerCookie);

    // Assert
    expect(mine.status).toBe(200);
    expect((await mine.json<IBody<{ id: string; role: string }>>()).data).toMatchObject({
      id: businessId,
      role: "OWNER",
    });
    expect(list.status).toBe(403);
    expect(create.status).toBe(403);
  });

  it("un usuario sin negocio recibe un mensaje claro", async () => {
    await createUser(NO_BUSINESS_USER);
    const cookie = await signIn(NO_BUSINESS_USER.email, NO_BUSINESS_USER.password);

    const response = await request("/api/v1/my-business", { headers: { cookie } });
    const body = await response.json<IBody<null>>();

    expect(response.status).toBe(403);
    expect(body.error).toContain("todavía no tiene un negocio asignado");
  });

  it("cada dueño ve solo su negocio", async () => {
    // Arrange
    const otherOwnerId = await createUser(OTHER_OWNER);
    await createBusiness({ name: "Streaming Beto", ownerId: otherOwnerId });
    const otherCookie = await signIn(OTHER_OWNER.email, OTHER_OWNER.password);

    // Act
    const response = await request("/api/v1/my-business", { headers: { cookie: otherCookie } });
    const body = await response.json<IBody<{ id: string; name: string }>>();

    // Assert
    expect(body.data.name).toBe("Streaming Beto");
    expect(body.data.id).not.toBe(businessId);
  });

  it("el superadmin renombra el negocio", async () => {
    const response = await patchJson(
      `/api/v1/businesses/${businessId}`,
      { name: "Streaming Ana Perú" },
      { cookie: superadminCookie },
    );
    const body = await response.json<IBody<IBusinessData>>();

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("Streaming Ana Perú");
    expect(body.data.owner?.id).toBe(ownerId);
  });

  it("un PATCH sin cambios se rechaza en español", async () => {
    const response = await patchJson(`/api/v1/businesses/${businessId}`, {}, { cookie: superadminCookie });
    const body = await response.json<IBody<null>>();

    expect(response.status).toBe(400);
    expect(body.error).toBe("No hay cambios para guardar.");
  });

  it("un negocio desactivado deja afuera a su dueño, y al reactivarlo vuelve a entrar", async () => {
    // Arrange
    const ownerCookie = await signIn(OWNER.email, OWNER.password);
    const url = `/api/v1/businesses/${businessId}`;

    // Act
    await patchJson(url, { isActive: false }, { cookie: superadminCookie });
    const blocked = await request("/api/v1/my-business", { headers: { cookie: ownerCookie } });
    await patchJson(url, { isActive: true }, { cookie: superadminCookie });
    const allowed = await request("/api/v1/my-business", { headers: { cookie: ownerCookie } });

    // Assert
    expect(blocked.status).toBe(403);
    expect((await blocked.json<IBody<null>>()).error).toContain("está desactivado");
    expect(allowed.status).toBe(200);
  });

  it("editar un negocio que no existe da 404", async () => {
    const response = await patchJson(
      "/api/v1/businesses/no-existe",
      { name: "Nada" },
      { cookie: superadminCookie },
    );

    expect(response.status).toBe(404);
  });
});
