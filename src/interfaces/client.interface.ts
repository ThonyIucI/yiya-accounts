import { ModelBase } from './base.interface';
import { IRental } from './rental.interface';

export interface IClient extends ModelBase {
  firstName: string;
  lastName: string;
  email: string;
  totalPrice: number;
  phone: string | null;
  description: string | null;
  others: string | null;
  //   Relations
  // rentals?: IRental[];
}
