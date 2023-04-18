import { IAccount } from './account.interface';
import { ModelBase } from './base.interface';

export interface ISupplier extends ModelBase {
  name: string;
  phone: string;
  notes: string;
  // Relations
  // accounts: IAccount[];
}
