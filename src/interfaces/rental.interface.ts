import { ModelBase } from './base.interface';
import { ICombo } from './combo.interface';
import { IProfile } from './profile.interface';
import { IRentalStatus } from './rentalStatus.interface';
import { IUser } from './user.interface';

export interface IRental extends ModelBase {
  rentalCode: string;
  priceRent: number;
  rentalDate: Date;
  returnDate: Date;
  userId: number;
  comboId: number | null;
  statusId: number;
  createdBy: number;
  updatedBy: number;
  deletedBy: number;
  //   Relations
  // rentalStatus: IRentalStatus;
  // user?: IUser;
  // profiles?: IProfile[];
  // combo?: ICombo;
}
