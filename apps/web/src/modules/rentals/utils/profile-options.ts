import type { IAccountResource } from "@yiya/shared/accounts";
import type { IRentalResource } from "@yiya/shared/rentals";

import type { IOption } from "@/common/components/select";

/** Los perfiles de una cuenta, como grupo del select (react-select). */
export interface IProfileOptionGroup {
  label: string;
  options: IOption[];
}

/** Con quién está cada perfil: `profileId` → nombres de los clientes. */
export type TProfileHolders = Map<string, string[]>;

/**
 * Quién tiene cada perfil, según los alquileres abiertos. `exceptRentalId`: al editar, el
 * alquiler que se edita no cuenta (si no, su propio perfil saldría ocupado por él).
 */
export const profileHoldersOf = (rentals: IRentalResource[], exceptRentalId?: string): TProfileHolders => {
  const holders: TProfileHolders = new Map();
  for (const rental of rentals) {
    if (rental.id !== exceptRentalId) {
      holders.set(rental.profile.id, [...(holders.get(rental.profile.id) ?? []), rental.customer.name]);
    }
  }
  return holders;
};

/**
 * El select de perfiles (RF-06): los del servicio elegido, **agrupados por cuenta** y **los
 * libres primero**, dentro de cada cuenta y entre cuentas. Los ocupados también se pueden
 * elegir y dicen con quién están («con Ana»): un perfil se comparte (acordado 2026-10-31).
 * Las cuentas desactivadas no salen.
 */
export const buildProfileOptions = (
  accounts: IAccountResource[],
  serviceId: string,
  holders: TProfileHolders,
): IProfileOptionGroup[] => {
  const groups = accounts
    .filter((account) => account.isActive && account.service.id === serviceId)
    .map((account) => {
      const options = account.profiles
        .map((profile) => {
          const names = holders.get(profile.id) ?? [];
          return {
            value: profile.id,
            label: profile.name,
            description: names.length > 0 ? `con ${names.join(", ")}` : "libre",
            isFree: names.length === 0,
          };
        })
        .sort((a, b) => Number(b.isFree) - Number(a.isFree));
      return {
        label: account.email,
        freeCount: options.filter((option) => option.isFree).length,
        options: options.map(({ isFree: _isFree, ...option }) => option),
      };
    })
    .sort((a, b) => b.freeCount - a.freeCount);

  return groups.map(({ freeCount: _freeCount, ...group }) => group);
};

/** La opción elegida dentro de los grupos, para el `value` del select. */
export const findProfileOption = (groups: IProfileOptionGroup[], profileId: string): IOption | null =>
  groups.flatMap((group) => group.options).find((option) => option.value === profileId) ?? null;
