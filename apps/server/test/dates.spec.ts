import { addMonths, daysBetween, isIsoDate, todayInLima } from "@yiya/shared/dates";
import { accountExpiresOn, getExpiry } from "@yiya/shared/purchases";
import { describe, expect, it } from "vitest";

describe("fechas de las compras", () => {
  it.each([
    ["2026-10-22", "2026-11-22"],
    ["2026-01-31", "2026-02-28"],
    ["2028-01-31", "2028-02-29"],
    ["2026-12-15", "2027-01-15"],
  ])("un mes después de %s es %s", (from, expected) => {
    expect(addMonths(from, 1)).toBe(expected);
  });

  it("acepta solo fechas «AAAA-MM-DD» que existen", () => {
    expect(isIsoDate("2026-10-22")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("22/10/2026")).toBe(false);
  });

  it("hoy es el de Perú aunque en UTC ya sea mañana", () => {
    // 2026-10-23 02:00 UTC = 2026-10-22 21:00 en Lima
    expect(todayInLima(new Date("2026-10-23T02:00:00Z"))).toBe("2026-10-22");
  });

  it("cuenta los días que faltan", () => {
    expect(daysBetween("2026-10-22", "2026-10-25")).toBe(3);
    expect(daysBetween("2026-10-22", "2026-10-21")).toBe(-1);
  });

  it("vencida si ya pasó, aviso si faltan 3 días o menos", () => {
    const today = "2026-10-22";

    expect(getExpiry("2026-10-21", today).status).toBe("expired");
    expect(getExpiry("2026-10-22", today)).toEqual({ status: "warning", days: 0 });
    expect(getExpiry("2026-10-25", today).status).toBe("warning");
    expect(getExpiry("2026-10-26", today).status).toBe("ok");
  });

  it("el vencimiento de la cuenta es el más lejano de sus compras", () => {
    const purchase = { id: "x", price: 20, purchasedOn: "2026-10-01" };

    expect(accountExpiresOn([])).toBeNull();
    expect(
      accountExpiresOn([
        { ...purchase, expiresOn: "2026-11-01" },
        { ...purchase, expiresOn: "2026-12-01" },
      ]),
    ).toBe("2026-12-01");
  });
});
