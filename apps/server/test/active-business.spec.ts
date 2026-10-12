import { beforeAll, describe, expect, it } from "vitest";

import { patchJson, postJson, putJson, request, signIn, signInAsSuperadmin } from "./helpers";

interface IBody<TData> {
  success: boolean;
  data: TData;
  error: string | null;
}

interface ICurrentBusinessData {
  id: string;
  name: string;
  isActive: boolean;
  role: string;
}

const OWNER_A = { name: "Dueña A", email: "duena-a@test.local", password: "password123" };
const OWNER_B = { name: "Dueño B", email: "dueno-b@test.local", password: "password123" };

describe("negocio activo del superadmin", () => {
  let superadminCookie = "";

  const myBusiness = async (cookie = superadminCookie) => {
    const response = await request("/api/v1/my-business", { headers: { cookie } });
    return { response, body: await response.json<IBody<ICurrentBusinessData>>() };
  };

  const createBusinessWithOwner = async (name: string, owner: typeof OWNER_A) => {
    const created = await postJson("/api/v1/users", owner, { cookie: superadminCookie });
    const ownerId = (await created.json<IBody<{ id: string }>>()).data.id;
    const response = await postJson(
      "/api/v1/businesses",
      { name, ownerId },
      { cookie: superadminCookie },
    );
    return (await response.json<IBody<{ id: string }>>()).data.id;
  };

  const chooseBusiness = (businessId: string, cookie = superadminCookie) =>
    putJson("/api/v1/me/active-business", { businessId }, { cookie });

  beforeAll(async () => {
    superadminCookie = (await signInAsSuperadmin()).cookie;
  });

  /* Va primero: es el único momento del archivo en que todavía no hay negocios. */
  it("sin ningún negocio creado, el superadmin recibe un mensaje claro", async () => {
    const { response, body } = await myBusiness();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Todavía no hay negocios. Crea el primero en Negocios.");
  });

  it("si nunca eligió, entra en el primero de la lista", async () => {
    // Arrange
    await createBusinessWithOwner("Negocio A", OWNER_A);
    await createBusinessWithOwner("Negocio B", OWNER_B);
    const list = await request("/api/v1/businesses", { headers: { cookie: superadminCookie } });
    const firstId = (await list.json<IBody<{ id: string }[]>>()).data[0]?.id;

    // Act
    const { response, body } = await myBusiness();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ id: firstId, role: "SUPERADMIN" });
  });

  it("elige otro negocio y desde ahí ve ese", async () => {
    // Arrange
    const list = await request("/api/v1/businesses", { headers: { cookie: superadminCookie } });
    const [, second] = (await list.json<IBody<{ id: string; name: string }[]>>()).data;

    // Act
    const chosen = await chooseBusiness(second!.id);
    const { body } = await myBusiness();

    // Assert
    expect(chosen.status).toBe(200);
    expect(body.data.id).toBe(second!.id);
    expect(body.data.name).toBe(second!.name);
  });

  it("la elección sigue al volver a iniciar sesión", async () => {
    // Arrange
    const before = (await myBusiness()).body.data.id;
    const newCookie = (await signInAsSuperadmin()).cookie;

    // Act
    const { body } = await myBusiness(newCookie);

    // Assert
    expect(body.data.id).toBe(before);
  });

  it("entra también a un negocio desactivado", async () => {
    // Arrange
    const current = (await myBusiness()).body.data;
    const url = `/api/v1/businesses/${current.id}`;
    await patchJson(url, { isActive: false }, { cookie: superadminCookie });

    // Act
    const { response, body } = await myBusiness();
    await patchJson(url, { isActive: true }, { cookie: superadminCookie });

    // Assert
    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ id: current.id, isActive: false });
  });

  it("elegir un negocio que no existe da 404 y no cambia la elección", async () => {
    // Arrange
    const before = (await myBusiness()).body.data.id;

    // Act
    const response = await chooseBusiness("no-existe");
    const after = (await myBusiness()).body.data.id;

    // Assert
    expect(response.status).toBe(404);
    expect((await response.json<IBody<null>>()).error).toBe("No encontramos ese negocio.");
    expect(after).toBe(before);
  });

  it("valida el cuerpo en español", async () => {
    const response = await putJson("/api/v1/me/active-business", {}, { cookie: superadminCookie });

    expect(response.status).toBe(400);
    expect((await response.json<IBody<null>>()).error).toBe("Elige un negocio.");
  });

  it("el dueño no puede cambiar de negocio y sigue viendo el suyo", async () => {
    // Arrange
    const ownerCookie = await signIn(OWNER_B.email, OWNER_B.password);
    const list = await request("/api/v1/businesses", { headers: { cookie: superadminCookie } });
    const businesses = (await list.json<IBody<{ id: string; name: string }[]>>()).data;
    const ownBusiness = businesses.find((item) => item.name === "Negocio B");
    const otherBusiness = businesses.find((item) => item.name === "Negocio A");

    // Act
    const response = await chooseBusiness(otherBusiness!.id, ownerCookie);
    const { body } = await myBusiness(ownerCookie);

    // Assert
    expect(response.status).toBe(403);
    expect(body.data).toMatchObject({ id: ownBusiness!.id, role: "OWNER" });
  });
});
