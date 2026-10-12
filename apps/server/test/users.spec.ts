import { beforeAll, describe, expect, it } from "vitest";

import { postJson, request, signIn, signInAsSuperadmin } from "./helpers";

interface IUserBody {
  success: boolean;
  data: { id: string; email: string; role: string };
  error: string | null;
}

const CLIENT = { name: "Cliente Uno", email: "cliente@test.local", password: "password123" };

describe("/users", () => {
  let superadminCookie = "";

  beforeAll(async () => {
    superadminCookie = (await signInAsSuperadmin()).cookie;
  });

  it("exige sesión", async () => {
    const response = await request("/api/v1/users");

    expect(response.status).toBe(401);
  });

  it("el superadmin crea un usuario con rol USER", async () => {
    // Act
    const response = await postJson("/api/v1/users", CLIENT, { cookie: superadminCookie });
    const body = await response.json<IUserBody>();

    // Assert
    expect(response.status).toBe(201);
    expect(body.data.email).toBe(CLIENT.email);
    expect(body.data.role).toBe("USER");
  });

  it("rechaza un correo repetido con 409", async () => {
    const response = await postJson("/api/v1/users", CLIENT, { cookie: superadminCookie });
    const body = await response.json<IUserBody>();

    expect(response.status).toBe(409);
    expect(body.error).toBe("Ya existe un usuario con ese correo.");
  });

  it("valida el cuerpo", async () => {
    const response = await postJson(
      "/api/v1/users",
      { name: "X", email: "no-es-correo", password: "corta" },
      { cookie: superadminCookie },
    );

    expect(response.status).toBe(400);
  });

  it("el usuario creado inicia sesión, pero no puede ver ni crear usuarios", async () => {
    // Arrange
    const clientCookie = await signIn(CLIENT.email, CLIENT.password);

    // Act
    const me = await request("/api/v1/me", { headers: { cookie: clientCookie } });
    const list = await request("/api/v1/users", { headers: { cookie: clientCookie } });
    const create = await postJson(
      "/api/v1/users",
      { name: "Otro", email: "otro@test.local", password: "password123" },
      { cookie: clientCookie },
    );

    // Assert
    expect(me.status).toBe(200);
    expect((await me.json<IUserBody>()).data.role).toBe("USER");
    expect(list.status).toBe(403);
    expect(create.status).toBe(403);
  });

  it("el superadmin ve la lista con el usuario creado", async () => {
    const response = await request("/api/v1/users", { headers: { cookie: superadminCookie } });
    const body = await response.json<{ data: { email: string }[] }>();

    expect(response.status).toBe(200);
    expect(body.data.map((item) => item.email)).toContain(CLIENT.email);
  });
});
