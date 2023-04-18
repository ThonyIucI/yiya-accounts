import { IAccount } from './account.interface';
import { ModelBase } from './base.interface';
import { IRental } from './rental.interface';

export interface IProfile extends ModelBase {
  accountId?: number | null;
  rentalId?: number | null;
  available: boolean;
  pin: string;
  priceRent: number;
  profileName: string;
  // Relations
  // account: IAccount;
  // rental?: IRental;
}
