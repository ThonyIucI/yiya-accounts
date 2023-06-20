import { Rental } from 'src/modules/rentals/entities/rental.entity';
import { ModelBase } from './base.interface';
import { IRole } from './role.interface';

export interface IUser extends ModelBase {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  totalPrice: number | null;
  phone: string;
  description: string;
  roleId?: number;
  // Relations
  role?: IRole;
  rentals?: Rental[];
}
