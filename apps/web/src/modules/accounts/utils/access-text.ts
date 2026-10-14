/**
 * La cuenta lista para pegar en WhatsApp («Copiar acceso», acordado 2026-10-13). Los `*`
 * son negrita en WhatsApp; el servicio va en mayúsculas.
 *
 *   📺 *CUENTA: NETFLIX*
 *   📧 Correo: cuenta@gmail.com
 *   🔑 Contraseña: la-contraseña
 */
export const buildAccessText = (serviceName: string, email: string, password: string): string =>
  [
    `📺 *CUENTA: ${serviceName.toLocaleUpperCase("es")}*`,
    `📧 Correo: ${email}`,
    `🔑 Contraseña: ${password}`,
  ].join("\n");
