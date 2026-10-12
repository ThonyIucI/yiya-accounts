/**
 * Catálogo inicial de servicios que carga `POST /internal/seed-services`. Los perfiles por
 * cuenta están **por confirmar con el cliente**; las imágenes se pegan después desde la
 * pantalla Servicios.
 */
export const INITIAL_SERVICE_CATALOG: readonly { name: string; profilesPerAccount: number }[] = [
  { name: "Netflix", profilesPerAccount: 5 },
  { name: "Disney+", profilesPerAccount: 7 },
  { name: "Max", profilesPerAccount: 5 },
  { name: "Prime Video", profilesPerAccount: 6 },
  { name: "Paramount+", profilesPerAccount: 6 },
  { name: "Crunchyroll", profilesPerAccount: 4 },
  { name: "Spotify", profilesPerAccount: 6 },
  { name: "YouTube Premium", profilesPerAccount: 6 },
  { name: "Apple TV+", profilesPerAccount: 6 },
  { name: "ViX", profilesPerAccount: 5 },
];
