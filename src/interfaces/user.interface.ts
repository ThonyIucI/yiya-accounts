import { ModelBase } from './base.interface';
import { IRole } from './role.interface';

export interface IUser extends ModelBase {
  name: string;
  lastName: string;
  email: string;
  password: string;
  roleId?: number;
  // Relations
  // role: IRole;
}
