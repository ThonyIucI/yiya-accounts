import { ModelBase } from './base.interface';
import { IProfile } from './profile.interface';
import { IService } from './service.interface';
import { ISupplier } from './supplier.interface';

export interface IAccount extends ModelBase {
  supplierId?: number | null;
  serviceId?: number | null;
  name: string;
  email: string;
  password: string;
  purchasePrice: number;
  profilesNumber: number;
  profilePrice: number;
  purchaseDate: Date;
  expirationDate: Date;
  // Relations
  // profiles: IProfile[];
  // service: IService[];
  // supplier: ISupplier;
}