import { ModelBase } from './base.interface';
import { IService } from './service.interface';

export interface ICombo extends ModelBase {
  price: number;
  // Relations
  services: IService[];
}
