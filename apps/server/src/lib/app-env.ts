import type { TAuth, TSession, TSessionUser } from "@yiya/auth";

/** Variables que los middlewares dejan en el contexto de Hono. */
export interface IAppVariables {
  auth: TAuth;
  user: TSessionUser;
  session: TSession["session"];
}

export type TAppEnv = { Variables: IAppVariables };
