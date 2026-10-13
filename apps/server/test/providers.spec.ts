import { beforeAll, describe, expect, it } from "vitest";

import { patchJson, postJson, request, signIn, signInAsSuperadmin } from "./helpers";

interface IBody<TData> {
  success: boolean;
  data: TData;
  error: string | null;
}

interface IProviderData {
  id: string;
  name: string;
  phone: { countryPrefix: string; number: string } | null;
  note: string | null;
}

const OWNER_A = { name: "Dueña A", email: "proveedores-a@test.local", password: "password123" };
const OWNER_B = { name: "Dueño B", email: "proveedores-b@test.local", password: "password123" };

const PERU_PHONE = { countryPrefix: "51", number: "987654321" };

describe("/providers", () => {
  let superadminCookie = "";
  let ownerACookie = "";
  let ownerBCookie = "";

  const createBusinessWithOwner = async (name: string, owner: typeof OWNER_A) => {
    const created = await postJson("/api/v1/users", owner, { cookie: superadminCookie });
    const ownerId = (await created.json<IBody<{ id: string }>>()).data.id;
    await postJson("/api/v1/businesses", { name, ownerId }, { cookie: superadminCookie });
  };

  const create = (body: unknown, cookie = ownerACookie) =>
    postJson("/api/v1/providers", body, { cookie });

  const createId = async (body: unknown, cookie = ownerACookie) =>
    (await (await create(body, cookie)).json<IBody<IProviderData>>()).data.id;

  const listFor = async (cookie: string) => {
    const response = await request("/api/v1/providers", { headers: { cookie } });
    return (await response.json<IBody<IProviderData[]>>()).data;
  };

  const remove = (id: string, cookie = ownerACookie) =>
    request(`/api/v1/providers/${id}`, { method: "DELETE", headers: { cookie } });

  const errorOf = async (response: Response) => (await response.json<IBody<null>>()).error;

  beforeAll(async () => {
    superadminCookie = (await signInAsSuperadmin()).cookie;
    await createBusinessWithOwner("Negocio A", OWNER_A);
    await createBusinessWithOwner("Negocio B", OWNER_B);
    ownerACookie = await signIn(OWNER_A.email, OWNER_A.password);
    ownerBCookie = await signIn(OWNER_B.email, OWNER_B.password);
  });

  it("crea un proveedor con su WhatsApp y su nota", async () => {
    // Act
    const response = await create({ name: "  Juan   Pérez ", phone: PERU_PHONE, note: "Netflix y Max" });
    const body = await response.json<IBody<IProviderData>>();

    // Assert
    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({ name: "Juan Pérez", phone: PERU_PHONE, note: "Netflix y Max" });
  });

  it("crea un proveedor solo con el nombre", async () => {
    const response = await create({ name: "Rosa" });
    const body = await response.json<IBody<IProviderData>>();

    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({ phone: null, note: null });
  });

  it("no deja repetir el nombre aunque cambien las mayúsculas, las tildes en mayúscula o los espacios", async () => {
    const response = await create({ name: "JUAN PÉREZ " });

    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe("Ya tienes un proveedor llamado «Juan Pérez».");
  });

  it("el mismo nombre en otro negocio sí se puede", async () => {
    const response = await create({ name: "Juan Pérez" }, ownerBCookie);

    expect(response.status).toBe(201);
  });

  it.each([
    [{ countryPrefix: "51", number: "12345" }, "Revisa el número: no es válido para ese país."],
    [{ countryPrefix: "1", number: "987654321" }, "Revisa el número: no es válido para ese país."],
    [{ countryPrefix: "999", number: "987654321" }, "Elige el país del número."],
    [{ countryPrefix: "51", number: "987-654-321" }, "El número solo lleva dígitos."],
  ])("rechaza el teléfono %o", async (phone, message) => {
    const response = await create({ name: `Con teléfono ${phone.countryPrefix}-${phone.number}`, phone });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe(message);
  });

  it("rechaza un nombre de una letra", async () => {
    const response = await create({ name: "J" });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("El nombre del proveedor es demasiado corto.");
  });

  it("edita el nombre y quita el teléfono", async () => {
    // Arrange
    const id = await createId({ name: "Carlos", phone: PERU_PHONE });

    // Act
    const response = await patchJson(
      `/api/v1/providers/${id}`,
      { name: "Carlos Ruiz", phone: null },
      { cookie: ownerACookie },
    );
    const body = await response.json<IBody<IProviderData>>();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ name: "Carlos Ruiz", phone: null });
  });

  it("editar sin cambios responde 400", async () => {
    const id = await createId({ name: "Sin cambios" });

    const response = await patchJson(`/api/v1/providers/${id}`, {}, { cookie: ownerACookie });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("No hay cambios para guardar.");
  });

  it("elimina un proveedor sin cuentas", async () => {
    // Arrange
    const id = await createId({ name: "Para eliminar" });

    // Act
    const response = await remove(id);
    const names = (await listFor(ownerACookie)).map((item) => item.name);

    // Assert
    expect(response.status).toBe(200);
    expect(names).not.toContain("Para eliminar");
  });

  it("el negocio B no ve ni toca los proveedores de A", async () => {
    // Arrange
    const id = await createId({ name: "Solo de A" });

    // Act
    const namesInB = (await listFor(ownerBCookie)).map((item) => item.name);
    const edit = await patchJson(`/api/v1/providers/${id}`, { name: "Robado" }, { cookie: ownerBCookie });
    const deletion = await remove(id, ownerBCookie);

    // Assert
    expect(namesInB).not.toContain("Solo de A");
    expect(edit.status).toBe(404);
    expect(await errorOf(deletion)).toBe("No encontramos ese proveedor.");
  });

  it("lista en orden alfabético", async () => {
    const names = (await listFor(ownerACookie)).map((item) => item.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" })));
  });

  it("sin sesión responde 401", async () => {
    const response = await request("/api/v1/providers");

    expect(response.status).toBe(401);
  });
});
