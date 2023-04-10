import { ModelBase } from './base.interface';
import { IClient } from './client.interface';
import { ICombo } from './combo.interface';
import { IProfile } from './profile.interface';
import { IRentalStatus } from './rentalStatus.interface';

export interface IRental extends ModelBase {
  rentalNumber: string;
  clientId: number;
  comboId: number;
  priceRent: number;
  rentalDate: Date;
  returnDate: Date;
  statusId: number;
  createdBy: number;
  updatedBy: number;
  deletedBy: number;
  //   Relations
  rentalStatus: IRentalStatus;
  client: IClient;
  profiles?: IProfile[];
  combo?: ICombo;
}
