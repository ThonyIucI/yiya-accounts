import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";

import { decryptPassword, encryptPassword } from "../src/lib/account-password";
import { patchJson, postJson, request, signIn, signInAsSuperadmin } from "./helpers";

interface IBody<TData> {
  success: boolean;
  data: TData;
  error: string | null;
}

interface IAccountData {
  id: string;
  email: string;
  isActive: boolean;
  note: string | null;
  service: { id: string; name: string };
  provider: { id: string; name: string };
  profiles: { id: string; name: string; pin: string | null; position: number }[];
  purchases: IPurchaseData[];
}

interface IPurchaseData {
  id: string;
  price: number;
  purchasedOn: string;
  expiresOn: string;
}

interface IProviderData {
  id: string;
  name: string;
  accountCount: number;
}

const OWNER_A = { name: "Dueña A", email: "cuentas-a@test.local", password: "password123" };
const OWNER_B = { name: "Dueño B", email: "cuentas-b@test.local", password: "password123" };
const SECRET = "Clave del proveedor 123";
const FIRST_PURCHASE = { price: 20, purchasedOn: "2026-10-01", expiresOn: "2026-11-01" };

describe("/accounts y /profiles", () => {
  let superadminCookie = "";
  let ownerACookie = "";
  let ownerBCookie = "";
  let netflixId = "";
  let disneyId = "";
  let maxId = "";
  let providerAId = "";
  let providerBId = "";

  const createBusinessWithOwner = async (name: string, owner: typeof OWNER_A) => {
    const created = await postJson("/api/v1/users", owner, { cookie: superadminCookie });
    const ownerId = (await created.json<IBody<{ id: string }>>()).data.id;
    await postJson("/api/v1/businesses", { name, ownerId }, { cookie: superadminCookie });
  };

  const createService = async (name: string, profilesPerAccount = 5) => {
    const response = await postJson(
      "/api/v1/services",
      { name, profilesPerAccount },
      { cookie: superadminCookie },
    );
    return (await response.json<IBody<{ id: string }>>()).data.id;
  };

  const activate = (serviceId: string, cookie: string) =>
    patchJson(
      `/api/v1/business-services/${serviceId}`,
      { purchasePrice: 20, profilePrice: 7.5, isActive: true },
      { cookie },
    );

  const createProvider = async (name: string, cookie: string) => {
    const response = await postJson("/api/v1/providers", { name }, { cookie });
    return (await response.json<IBody<{ id: string }>>()).data.id;
  };

  const create = (body: Record<string, unknown>, cookie = ownerACookie) =>
    postJson(
      "/api/v1/accounts",
      {
        serviceId: netflixId,
        providerId: providerAId,
        password: SECRET,
        profileCount: 5,
        purchase: FIRST_PURCHASE,
        ...body,
      },
      { cookie },
    );

  const createAccount = async (body: Record<string, unknown>) =>
    (await (await create(body)).json<IBody<IAccountData>>()).data;

  const get = (path: string, cookie = ownerACookie) => request(path, { headers: { cookie } });

  const remove = (path: string, cookie = ownerACookie) =>
    request(path, { method: "DELETE", headers: { cookie } });

  const errorOf = async (response: Response) => (await response.json<IBody<null>>()).error;

  const passwordOf = async (accountId: string, cookie = ownerACookie) =>
    (await (await get(`/api/v1/accounts/${accountId}/password`, cookie)).json<IBody<{ password: string }>>())
      .data.password;

  beforeAll(async () => {
    superadminCookie = (await signInAsSuperadmin()).cookie;
    await createBusinessWithOwner("Negocio A", OWNER_A);
    await createBusinessWithOwner("Negocio B", OWNER_B);
    netflixId = await createService("Netflix");
    disneyId = await createService("Disney+", 7);
    maxId = await createService("Max");
    ownerACookie = await signIn(OWNER_A.email, OWNER_A.password);
    ownerBCookie = await signIn(OWNER_B.email, OWNER_B.password);
    await activate(netflixId, ownerACookie);
    await activate(disneyId, ownerACookie);
    await activate(netflixId, ownerBCookie);
    providerAId = await createProvider("Proveedor A", ownerACookie);
    providerBId = await createProvider("Proveedor B", ownerBCookie);
  });

  describe("cuentas", () => {
    it("registra la cuenta con sus perfiles «Perfil 1…5»", async () => {
      // Act
      const response = await create({ email: " Cuenta1@Gmail.com ", note: "Pantalla 4K" });
      const body = await response.json<IBody<IAccountData>>();

      // Assert
      expect(response.status).toBe(201);
      expect(body.data).toMatchObject({
        email: "Cuenta1@Gmail.com",
        isActive: true,
        note: "Pantalla 4K",
        service: { name: "Netflix" },
        provider: { name: "Proveedor A" },
      });
      expect(body.data.profiles.map((item) => item.name)).toEqual([
        "Perfil 1",
        "Perfil 2",
        "Perfil 3",
        "Perfil 4",
        "Perfil 5",
      ]);
    });

    it("no registra cuentas de un servicio que el negocio no tiene activo", async () => {
      const response = await create({ email: "max@gmail.com", serviceId: maxId });

      expect(response.status).toBe(400);
      expect(await errorOf(response)).toBe("Activa Max en Servicios para registrar cuentas.");
    });

    it("no acepta un proveedor de otro negocio", async () => {
      const response = await create({ email: "ajeno@gmail.com", providerId: providerBId });

      expect(response.status).toBe(404);
      expect(await errorOf(response)).toBe("No encontramos ese proveedor.");
    });

    it("no repite el correo en el mismo servicio, pero sí en otro", async () => {
      // Arrange
      await createAccount({ email: "repetida@gmail.com" });

      // Act
      const sameService = await create({ email: "REPETIDA@gmail.com" });
      const otherService = await create({ email: "repetida@gmail.com", serviceId: disneyId });

      // Assert
      expect(sameService.status).toBe(409);
      expect(await errorOf(sameService)).toBe("Ya tienes una cuenta de Netflix con ese correo.");
      expect(otherService.status).toBe(201);
    });

    it.each([
      [{ email: "no-es-correo" }, "Escribe un correo válido."],
      [{ email: "ok@gmail.com", password: "" }, "Escribe la contraseña."],
      [{ email: "ok@gmail.com", profileCount: 0 }, "La cuenta necesita al menos un perfil."],
      [{ email: "ok@gmail.com", profileCount: 1.5 }, "La cuenta necesita al menos un perfil."],
    ])("rechaza %o", async (body, message) => {
      const response = await create(body);

      expect(response.status).toBe(400);
      expect(await errorOf(response)).toBe(message);
    });

    it("guarda la contraseña cifrada y solo la devuelve en /password", async () => {
      // Arrange
      const created = await createAccount({ email: "cifrada@gmail.com" });

      // Act
      const stored = await env.DB.prepare("select password_encrypted from streaming_account where id = ?")
        .bind(created.id)
        .first<{ password_encrypted: string }>();
      const listText = await (await get("/api/v1/accounts")).text();
      const detailText = await (await get(`/api/v1/accounts/${created.id}`)).text();

      // Assert
      expect(stored?.password_encrypted).not.toContain(SECRET);
      expect(listText).not.toContain(SECRET);
      expect(detailText).not.toContain(SECRET);
      expect(await passwordOf(created.id)).toBe(SECRET);
    });

    it("editar sin contraseña la deja igual; con contraseña, la cambia", async () => {
      // Arrange
      const created = await createAccount({ email: "editar@gmail.com" });
      const path = `/api/v1/accounts/${created.id}`;

      // Act
      await patchJson(path, { note: "Cambió la nota" }, { cookie: ownerACookie });
      const afterNote = await passwordOf(created.id);
      await patchJson(path, { password: "Nueva 456" }, { cookie: ownerACookie });
      const afterPassword = await passwordOf(created.id);

      // Assert
      expect(afterNote).toBe(SECRET);
      expect(afterPassword).toBe("Nueva 456");
    });

    it("mandar el servicio al editar no lo cambia", async () => {
      const created = await createAccount({ email: "servicio-fijo@gmail.com" });

      const response = await patchJson(
        `/api/v1/accounts/${created.id}`,
        { serviceId: disneyId, note: "x" },
        { cookie: ownerACookie },
      );
      const body = await response.json<IBody<IAccountData>>();

      expect(body.data.service.name).toBe("Netflix");
    });

    it("se desactiva y se vuelve a activar con el switch", async () => {
      // Arrange
      const created = await createAccount({ email: "switch@gmail.com" });
      const path = `/api/v1/accounts/${created.id}`;

      // Act
      const off = await (await patchJson(path, { isActive: false }, { cookie: ownerACookie })).json<
        IBody<IAccountData>
      >();
      const on = await (await patchJson(path, { isActive: true }, { cookie: ownerACookie })).json<
        IBody<IAccountData>
      >();

      // Assert
      expect(off.data.isActive).toBe(false);
      expect(on.data.isActive).toBe(true);
    });

    it("eliminar la cuenta elimina sus perfiles", async () => {
      // Arrange
      const created = await createAccount({ email: "eliminar@gmail.com" });

      // Act
      const response = await remove(`/api/v1/accounts/${created.id}`);
      const left = await env.DB.prepare("select count(*) as total from profile where account_id = ?")
        .bind(created.id)
        .first<{ total: number }>();

      // Assert
      expect(response.status).toBe(200);
      expect(left?.total).toBe(0);
    });

    it("el negocio B no ve la cuenta ni la contraseña de A", async () => {
      // Arrange
      const created = await createAccount({ email: "solo-a@gmail.com" });

      // Act
      const listB = await (await get("/api/v1/accounts", ownerBCookie)).json<IBody<IAccountData[]>>();
      const detail = await get(`/api/v1/accounts/${created.id}`, ownerBCookie);
      const password = await get(`/api/v1/accounts/${created.id}/password`, ownerBCookie);
      const edit = await patchJson(
        `/api/v1/accounts/${created.id}`,
        { note: "robada" },
        { cookie: ownerBCookie },
      );

      // Assert
      expect(listB.data.map((item) => item.email)).not.toContain("solo-a@gmail.com");
      expect(detail.status).toBe(404);
      expect(password.status).toBe(404);
      expect(edit.status).toBe(404);
    });
  });

  describe("perfiles", () => {
    it("agregar suma «Perfil 6» al final", async () => {
      const created = await createAccount({ email: "agregar@gmail.com" });

      const response = await postJson(`/api/v1/accounts/${created.id}/profiles`, {}, { cookie: ownerACookie });
      const body = await response.json<IBody<IAccountData>>();

      expect(response.status).toBe(201);
      expect(body.data.profiles.at(-1)).toMatchObject({ name: "Perfil 6", position: 6 });
    });

    it.each(["12a4", "123", "12345"])("rechaza el PIN «%s»", async (pin) => {
      const created = await createAccount({ email: `pin-${pin}@gmail.com` });

      const response = await patchJson(
        `/api/v1/profiles/${created.profiles[0]!.id}`,
        { pin },
        { cookie: ownerACookie },
      );

      expect(response.status).toBe(400);
      expect(await errorOf(response)).toBe("El PIN son 4 números.");
    });

    it("cambia el nombre y el PIN, y el PIN vacío lo quita", async () => {
      // Arrange
      const created = await createAccount({ email: "pin-ok@gmail.com" });
      const path = `/api/v1/profiles/${created.profiles[0]!.id}`;

      // Act
      const saved = await (
        await patchJson(path, { name: "Mamá", pin: "1234" }, { cookie: ownerACookie })
      ).json<IBody<{ name: string; pin: string | null }>>();
      const cleared = await (await patchJson(path, { pin: "" }, { cookie: ownerACookie })).json<
        IBody<{ pin: string | null }>
      >();

      // Assert
      expect(saved.data).toMatchObject({ name: "Mamá", pin: "1234" });
      expect(cleared.data.pin).toBeNull();
    });

    it("no deja eliminar el último perfil", async () => {
      // Arrange
      const created = await createAccount({ email: "un-perfil@gmail.com", profileCount: 1 });

      // Act
      const response = await remove(`/api/v1/profiles/${created.profiles[0]!.id}`);

      // Assert
      expect(response.status).toBe(400);
      expect(await errorOf(response)).toBe("La cuenta necesita al menos un perfil.");
    });

    it("el negocio B no toca los perfiles de A", async () => {
      const created = await createAccount({ email: "perfiles-a@gmail.com" });

      const response = await patchJson(
        `/api/v1/profiles/${created.profiles[0]!.id}`,
        { name: "Robado" },
        { cookie: ownerBCookie },
      );

      expect(response.status).toBe(404);
    });
  });

  describe("compras", () => {
    const renew = (accountId: string, body: Record<string, unknown>, cookie = ownerACookie) =>
      postJson(`/api/v1/accounts/${accountId}/purchases`, body, { cookie });

    it("registrar la cuenta registra su primera compra", async () => {
      const created = await createAccount({ email: "compra1@gmail.com" });

      expect(created.purchases).toEqual([expect.objectContaining(FIRST_PURCHASE)]);
    });

    it("no registra la cuenta sin su compra", async () => {
      const response = await create({ email: "sin-compra@gmail.com", purchase: undefined });

      expect(response.status).toBe(400);
      expect(await errorOf(response)).toBe(
        "Completa la compra: precio, fecha de compra y vencimiento.",
      );
    });

    it("renovar agrega una compra y el listado la trae primero", async () => {
      // Arrange
      const created = await createAccount({ email: "renovar@gmail.com" });
      const renewal = { price: 22.5, purchasedOn: "2026-11-01", expiresOn: "2026-12-01" };

      // Act
      const response = await renew(created.id, renewal);
      const list = await (await get("/api/v1/accounts")).json<IBody<IAccountData[]>>();
      const listed = list.data.find((item) => item.id === created.id);

      // Assert
      expect(response.status).toBe(201);
      expect(listed?.purchases.map((item) => item.expiresOn)).toEqual(["2026-12-01", "2026-11-01"]);
      expect(listed?.purchases[0]).toMatchObject(renewal);
    });

    it("no acepta un vencimiento antes de la compra", async () => {
      const created = await createAccount({ email: "fechas@gmail.com" });

      const response = await renew(created.id, {
        price: 20,
        purchasedOn: "2026-11-10",
        expiresOn: "2026-11-09",
      });

      expect(response.status).toBe(400);
      expect(await errorOf(response)).toBe("El vencimiento no puede ser antes de la fecha de compra.");
    });

    it.each(["2026-02-30", "22/10/2026", ""])("rechaza la fecha «%s»", async (purchasedOn) => {
      const created = await createAccount({ email: `fecha-${purchasedOn.replaceAll("/", "")}@gmail.com` });

      const response = await renew(created.id, { price: 20, purchasedOn, expiresOn: "2026-12-01" });

      expect(response.status).toBe(400);
      expect(await errorOf(response)).toBe("Elige una fecha válida.");
    });

    it("corrige una compra y compara la fecha nueva con la guardada", async () => {
      // Arrange
      const created = await createAccount({ email: "corregir@gmail.com" });
      const path = `/api/v1/purchases/${created.purchases[0]!.id}`;

      // Act
      const saved = await (await patchJson(path, { price: 18 }, { cookie: ownerACookie })).json<
        IBody<IAccountData>
      >();
      const invalid = await patchJson(path, { expiresOn: "2026-09-30" }, { cookie: ownerACookie });

      // Assert
      expect(saved.data.purchases[0]).toMatchObject({ ...FIRST_PURCHASE, price: 18 });
      expect(invalid.status).toBe(400);
    });

    it("elimina una compra, pero no la única", async () => {
      // Arrange
      const created = await createAccount({ email: "eliminar-compra@gmail.com" });
      const renewed = await (
        await renew(created.id, { price: 20, purchasedOn: "2026-11-01", expiresOn: "2026-12-01" })
      ).json<IBody<IAccountData>>();

      // Act
      const first = await remove(`/api/v1/purchases/${renewed.data.purchases[0]!.id}`);
      const last = await remove(`/api/v1/purchases/${renewed.data.purchases[1]!.id}`);

      // Assert
      expect(first.status).toBe(200);
      expect(last.status).toBe(400);
      expect(await errorOf(last)).toBe("La cuenta necesita al menos una compra.");
    });

    it("eliminar la cuenta elimina sus compras", async () => {
      const created = await createAccount({ email: "cuenta-con-compras@gmail.com" });

      await remove(`/api/v1/accounts/${created.id}`);
      const left = await env.DB.prepare(
        "select count(*) as total from account_purchase where account_id = ?",
      )
        .bind(created.id)
        .first<{ total: number }>();

      expect(left?.total).toBe(0);
    });

    it("el negocio B no renueva, corrige ni elimina las compras de A", async () => {
      // Arrange
      const created = await createAccount({ email: "compras-a@gmail.com" });
      const purchasePath = `/api/v1/purchases/${created.purchases[0]!.id}`;

      // Act
      const renewal = await renew(created.id, FIRST_PURCHASE, ownerBCookie);
      const edit = await patchJson(purchasePath, { price: 1 }, { cookie: ownerBCookie });
      const deletion = await remove(purchasePath, ownerBCookie);

      // Assert
      expect(renewal.status).toBe(404);
      expect(edit.status).toBe(404);
      expect(deletion.status).toBe(404);
    });
  });

  describe("proveedores con cuentas", () => {
    it("el listado cuenta sus cuentas y no deja eliminarlo", async () => {
      // Arrange
      const providerId = await createProvider("Con cuentas", ownerACookie);
      await createAccount({ email: "p1@gmail.com", providerId });
      await createAccount({ email: "p2@gmail.com", providerId });

      // Act
      const providers = await (await get("/api/v1/providers")).json<IBody<IProviderData[]>>();
      const response = await remove(`/api/v1/providers/${providerId}`);

      // Assert
      expect(providers.data.find((item) => item.id === providerId)?.accountCount).toBe(2);
      expect(response.status).toBe(409);
      expect(await errorOf(response)).toBe(
        "No puedes eliminar a «Con cuentas»: tiene 2 cuentas. Cámbiales el proveedor o elimínalas primero.",
      );
    });
  });

  describe("cifrado", () => {
    it("cifrar y descifrar da lo mismo, y dos cifrados de lo mismo son distintos", async () => {
      const first = await encryptPassword(SECRET);
      const second = await encryptPassword(SECRET);

      expect(first).not.toBe(second);
      expect(await decryptPassword(first)).toBe(SECRET);
    });
  });
});
