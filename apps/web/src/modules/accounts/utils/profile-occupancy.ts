import type { IProfileResource } from "@yiya/shared/accounts";

/**
 * Cuántos perfiles están libres. Hasta los alquileres (paso 4) todos lo están: cuando
 * existan, esto mira si el perfil tiene un alquiler vigente.
 */
export const freeProfiles = (profiles: IProfileResource[]): IProfileResource[] => profiles;

/** «P1», «P2»…: el chip corto de la card. */
export const profileChipLabel = (profile: IProfileResource): string => `P${profile.position}`;
