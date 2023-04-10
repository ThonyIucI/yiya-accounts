import { ModelBase } from './base.interface';
import { ICombo } from './combo.interface';
import { IProfile } from './profile.interface';

export interface IService extends ModelBase {
  name: string;
  logo: string;
  originalPurchasePrice: string;
  //Relations
  profiles?: IProfile[];
  combos?: ICombo[];
}
