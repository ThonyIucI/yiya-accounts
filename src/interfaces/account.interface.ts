import { ModelBase } from './base.interface';
import { IProfile } from './profile.interface';
import { IService } from './service.interface';
import { ISupplier } from './supplier.interface';

export interface IAccount extends ModelBase {
  supplierId: number;
  serviceId: number;
  name: string;
  email: string;
  password: string;
  purchasePrice: number;
  profilePrice: number;
  purchaseDate: Date;
  expirationDate: Date;
  // Relations
  profiles?: IProfile[];
  service?: IService;
  supplier?: ISupplier;
}
