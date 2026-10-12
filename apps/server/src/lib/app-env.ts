import type { TAuth, TSession, TSessionUser } from "@yiya/auth";
import type { ICurrentBusiness } from "@yiya/shared/businesses";

/** Variables que los middlewares dejan en el contexto de Hono. */
export interface IAppVariables {
  auth: TAuth;
  user: TSessionUser;
  session: TSession["session"];
  /** Solo en rutas con `requireBusiness`: el negocio sale de la sesión, nunca del request. */
  business: ICurrentBusiness;
}

export type TAppEnv = { Variables: IAppVariables };
