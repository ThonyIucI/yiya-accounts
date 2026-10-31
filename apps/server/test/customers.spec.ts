import { beforeAll, describe, expect, it } from "vitest";

import { patchJson, postJson, request, signIn, signInAsSuperadmin } from "./helpers";

interface IBody<TData> {
  success: boolean;
  data: TData;
  error: string | null;
}

interface ICustomerData {
  id: string;
  name: string;
  phone: { countryPrefix: string; number: string } | null;
  whatsappUsername: string | null;
  note: string | null;
}

const OWNER_A = { name: "Dueña A", email: "clientes-a@test.local", password: "password123" };
const OWNER_B = { name: "Dueño B", email: "clientes-b@test.local", password: "password123" };

const PERU_PHONE = { countryPrefix: "51", number: "987654321" };
const OTHER_PHONE = { countryPrefix: "51", number: "912345678" };

describe("/customers", () => {
  let superadminCookie = "";
  let ownerACookie = "";
  let ownerBCookie = "";

  const createBusinessWithOwner = async (name: string, owner: typeof OWNER_A) => {
    const created = await postJson("/api/v1/users", owner, { cookie: superadminCookie });
    const ownerId = (await created.json<IBody<{ id: string }>>()).data.id;
    await postJson("/api/v1/businesses", { name, ownerId }, { cookie: superadminCookie });
  };

  const create = (body: unknown, cookie = ownerACookie) =>
    postJson("/api/v1/customers", body, { cookie });

  const createId = async (body: unknown, cookie = ownerACookie) =>
    (await (await create(body, cookie)).json<IBody<ICustomerData>>()).data.id;

  const update = (id: string, body: unknown, cookie = ownerACookie) =>
    patchJson(`/api/v1/customers/${id}`, body, { cookie });

  const listFor = async (cookie: string) => {
    const response = await request("/api/v1/customers", { headers: { cookie } });
    return (await response.json<IBody<ICustomerData[]>>()).data;
  };

  const remove = (id: string, cookie = ownerACookie) =>
    request(`/api/v1/customers/${id}`, { method: "DELETE", headers: { cookie } });

  const errorOf = async (response: Response) => (await response.json<IBody<null>>()).error;

  beforeAll(async () => {
    superadminCookie = (await signInAsSuperadmin()).cookie;
    await createBusinessWithOwner("Negocio A", OWNER_A);
    await createBusinessWithOwner("Negocio B", OWNER_B);
    ownerACookie = await signIn(OWNER_A.email, OWNER_A.password);
    ownerBCookie = await signIn(OWNER_B.email, OWNER_B.password);
  });

  it("crea un cliente con su número, su usuario y su nota", async () => {
    // Act
    const response = await create({
      name: "  Ana   Pérez ",
      phone: PERU_PHONE,
      whatsappUsername: "Ana.pe",
      note: "Paga a fin de mes",
    });
    const body = await response.json<IBody<ICustomerData>>();

    // Assert
    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({
      name: "Ana Pérez",
      phone: PERU_PHONE,
      whatsappUsername: "Ana.pe",
      note: "Paga a fin de mes",
    });
  });

  it("dos clientes con el mismo nombre se crean los dos", async () => {
    const first = await create({ name: "Luis" });
    const second = await create({ name: "Luis" });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
  });

  it("no deja repetir el número y dice quién lo tiene", async () => {
    const response = await create({ name: "Otra Ana", phone: PERU_PHONE });

    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe("Ya tienes a «Ana Pérez» con ese número.");
  });

  it("no deja repetir el usuario aunque cambien las mayúsculas", async () => {
    const response = await create({ name: "Otra Ana", whatsappUsername: "ana.PE" });

    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe("Ya tienes a «Ana Pérez» con ese usuario.");
  });

  it("guarda el usuario sin la «@»", async () => {
    const response = await create({ name: "Marco", whatsappUsername: " @marco_99 " });
    const body = await response.json<IBody<ICustomerData>>();

    expect(response.status).toBe(201);
    expect(body.data.whatsappUsername).toBe("marco_99");
  });

  it.each(["ab", "ana pe", "ana-pe", "a".repeat(36)])("rechaza el usuario «%s»", async (username) => {
    const response = await create({ name: "Con usuario", whatsappUsername: username });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe(
      "El usuario va de 3 a 35 caracteres: letras, números, punto o guion bajo.",
    );
  });

  it("el mismo número y usuario en otro negocio sí se pueden", async () => {
    const response = await create(
      { name: "Ana Pérez", phone: PERU_PHONE, whatsappUsername: "ana.pe" },
      ownerBCookie,
    );

    expect(response.status).toBe(201);
  });

  it("varios clientes sin número ni usuario se crean todos", async () => {
    const statuses = await Promise.all(
      ["Sin datos 1", "Sin datos 2", "Sin datos 3"].map(async (name) => (await create({ name })).status),
    );

    expect(statuses).toEqual([201, 201, 201]);
  });

  it("no deja cambiar el número o el usuario al de otro cliente", async () => {
    // Arrange
    const id = await createId({ name: "Carla", phone: OTHER_PHONE, whatsappUsername: "carla" });

    // Act
    const samePhone = await update(id, { phone: PERU_PHONE });
    const sameUsername = await update(id, { whatsappUsername: "ANA.PE" });

    // Assert
    expect(samePhone.status).toBe(409);
    expect(await errorOf(samePhone)).toBe("Ya tienes a «Ana Pérez» con ese número.");
    expect(sameUsername.status).toBe(409);
    expect(await errorOf(sameUsername)).toBe("Ya tienes a «Ana Pérez» con ese usuario.");
  });

  it("dejar su propio número y usuario al editar sí se puede", async () => {
    // Arrange
    const id = await createId({ name: "Diego", phone: { countryPrefix: "51", number: "923456789" }, whatsappUsername: "diego" });

    // Act
    const response = await update(id, {
      name: "Diego R.",
      phone: { countryPrefix: "51", number: "923456789" },
      whatsappUsername: "Diego",
    });
    const body = await response.json<IBody<ICustomerData>>();

    // Assert
    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ name: "Diego R.", whatsappUsername: "Diego" });
  });

  it("edita quitando el número y el usuario", async () => {
    const id = await createId({ name: "Elena", phone: { countryPrefix: "51", number: "934567890" }, whatsappUsername: "elena" });

    const response = await update(id, { phone: null, whatsappUsername: "" });
    const body = await response.json<IBody<ICustomerData>>();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ phone: null, whatsappUsername: null });
  });

  it("rechaza un número que no es del país", async () => {
    const response = await create({ name: "Número malo", phone: { countryPrefix: "51", number: "12345" } });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("Revisa el número: no es válido para ese país.");
  });

  it("rechaza un nombre de una letra", async () => {
    const response = await create({ name: "A" });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("El nombre va de 2 a 60 letras.");
  });

  it("rechaza una nota de más de 200 letras", async () => {
    const response = await create({ name: "Con nota larga", note: "a".repeat(201) });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("La nota va hasta 200 letras.");
  });

  it("editar sin cambios responde 400", async () => {
    const id = await createId({ name: "Sin cambios" });

    const response = await update(id, {});

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("No hay cambios para guardar.");
  });

  it("elimina un cliente", async () => {
    // Arrange
    const id = await createId({ name: "Para eliminar" });

    // Act
    const response = await remove(id);
    const names = (await listFor(ownerACookie)).map((item) => item.name);

    // Assert
    expect(response.status).toBe(200);
    expect(names).not.toContain("Para eliminar");
  });

  it("el negocio B no ve ni toca los clientes de A", async () => {
    // Arrange
    const id = await createId({ name: "Solo de A" });

    // Act
    const namesInB = (await listFor(ownerBCookie)).map((item) => item.name);
    const detail = await request(`/api/v1/customers/${id}`, { headers: { cookie: ownerBCookie } });
    const edit = await update(id, { name: "Robado" }, ownerBCookie);
    const deletion = await remove(id, ownerBCookie);

    // Assert
    expect(namesInB).not.toContain("Solo de A");
    expect(detail.status).toBe(404);
    expect(edit.status).toBe(404);
    expect(await errorOf(deletion)).toBe("No encontramos ese cliente.");
  });

  it("lista en orden alfabético", async () => {
    const names = (await listFor(ownerACookie)).map((item) => item.name.toLowerCase());

    expect(names).toEqual([...names].sort());
  });

  it("sin sesión responde 401", async () => {
    const response = await request("/api/v1/customers");

    expect(response.status).toBe(401);
  });
});
