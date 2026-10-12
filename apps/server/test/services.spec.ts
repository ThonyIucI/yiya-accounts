import { env } from "cloudflare:workers";
import { parseSoles } from "@yiya/shared/money";
import { beforeAll, describe, expect, it } from "vitest";

import { patchJson, postJson, request, signIn, signInAsSuperadmin } from "./helpers";

interface IBody<TData> {
  success: boolean;
  data: TData;
  error: string | null;
}

interface ICatalogData {
  id: string;
  name: string;
  profilesPerAccount: number;
  imageUrl: string | null;
  activeInCount: number;
}

const OWNER = { name: "Dueña Catálogo", email: "duena-catalogo@test.local", password: "password123" };
const NETFLIX_IMAGE = "https://cdn.test.local/netflix.png";

describe("/services (catálogo global)", () => {
  let superadminCookie = "";
  let serviceId = "";

  const createService = (body: unknown, cookie = superadminCookie) =>
    postJson("/api/v1/services", body, { cookie });

  const errorOf = async (response: Response) => (await response.json<IBody<null>>()).error;

  beforeAll(async () => {
    superadminCookie = (await signInAsSuperadmin()).cookie;
  });

  it("el superadmin crea un servicio con imagen y 12 perfiles", async () => {
    // Act
    const response = await createService({
      name: "Netflix",
      profilesPerAccount: 12,
      imageUrl: NETFLIX_IMAGE,
    });
    const body = await response.json<IBody<ICatalogData>>();

    // Assert
    expect(response.status).toBe(201);
    expect(body.data).toMatchObject({
      name: "Netflix",
      profilesPerAccount: 12,
      imageUrl: NETFLIX_IMAGE,
      activeInCount: 0,
    });
    serviceId = body.data.id;
  });

  it("no deja repetir el nombre aunque cambien las mayúsculas o los espacios", async () => {
    const response = await createService({ name: "  netflix ", profilesPerAccount: 5 });

    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe("Ya existe el servicio «Netflix».");
  });

  it.each([
    [{ name: "Max", profilesPerAccount: 0 }, "Los perfiles por cuenta deben ser un número entero desde 1."],
    [{ name: "Max", profilesPerAccount: 2.5 }, "Los perfiles por cuenta deben ser un número entero desde 1."],
    [
      { name: "Max", profilesPerAccount: 5, imageUrl: "http://cdn.test.local/max.png" },
      "El link de la imagen debe empezar con https://.",
    ],
    [{ name: "M", profilesPerAccount: 5 }, "El nombre del servicio es demasiado corto."],
  ])("valida en español: %j", async (body, message) => {
    const response = await createService(body);

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe(message);
  });

  it("el superadmin edita el servicio y puede quitarle la imagen", async () => {
    const response = await patchJson(
      `/api/v1/services/${serviceId}`,
      { name: "Netflix Premium", imageUrl: "" },
      { cookie: superadminCookie },
    );
    const body = await response.json<IBody<ICatalogData>>();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ name: "Netflix Premium", imageUrl: null, profilesPerAccount: 12 });
  });

  it("un PATCH sin cambios se rechaza", async () => {
    const response = await patchJson(`/api/v1/services/${serviceId}`, {}, { cookie: superadminCookie });

    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("No hay cambios para guardar.");
  });

  it("editar un servicio que no existe da 404", async () => {
    const response = await patchJson(
      "/api/v1/services/no-existe",
      { profilesPerAccount: 4 },
      { cookie: superadminCookie },
    );

    expect(response.status).toBe(404);
    expect(await errorOf(response)).toBe("No encontramos ese servicio.");
  });

  it("el dueño no puede ver el catálogo global, ni crear ni editar servicios", async () => {
    // Arrange
    await postJson("/api/v1/users", OWNER, { cookie: superadminCookie });
    const ownerCookie = await signIn(OWNER.email, OWNER.password);

    // Act
    const list = await request("/api/v1/services", { headers: { cookie: ownerCookie } });
    const create = await createService({ name: "Intruso", profilesPerAccount: 5 }, ownerCookie);
    const edit = await patchJson(
      `/api/v1/services/${serviceId}`,
      { name: "Intruso" },
      { cookie: ownerCookie },
    );

    // Assert
    expect([list.status, create.status, edit.status]).toEqual([403, 403, 403]);
  });

  it("el seed carga el catálogo inicial y correrlo dos veces no duplica", async () => {
    // Arrange
    const seed = () =>
      request("/api/v1/internal/seed-services", {
        method: "POST",
        headers: { "x-seed-token": env.SEED_TOKEN },
      });

    // Act
    const first = await seed();
    const second = await seed();
    const list = await request("/api/v1/services", { headers: { cookie: superadminCookie } });
    const names = (await list.json<IBody<ICatalogData[]>>()).data.map((item) => item.name);

    // Assert
    expect(first.status).toBe(201);
    expect((await first.json<IBody<{ created: string[] }>>()).data.created).toContain("Disney+");
    expect((await second.json<IBody<{ created: string[] }>>()).data.created).toEqual([]);
    expect(names.filter((name) => name === "Disney+")).toHaveLength(1);
  });

  it("el seed exige el token", async () => {
    const response = await request("/api/v1/internal/seed-services", { method: "POST" });

    expect(response.status).toBe(403);
  });
});

describe("parseSoles", () => {
  it.each([
    ["7", 7],
    ["7,5", 7.5],
    ["7.50", 7.5],
    [" 20 ", 20],
  ])("«%s» → %d", (input, expected) => {
    expect(parseSoles(input)).toBe(expected);
  });

  it.each(["7.555", "0", "", "abc", "-3", "7."])("«%s» no es un precio", (input) => {
    expect(parseSoles(input)).toBeNull();
  });
});
