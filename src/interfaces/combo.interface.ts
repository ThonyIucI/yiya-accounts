import { ModelBase } from './base.interface';
import { IService } from './service.interface';

export interface ICombo extends ModelBase {
  name: string;
  price: number;
  // Relations
  // services: IService[];
}
