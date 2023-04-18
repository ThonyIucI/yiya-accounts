import { IRental } from 'src/interfaces';
import { BaseModelEntity } from 'src/modules/data/entities/base.entity';
import { Column, Entity } from 'typeorm';
@Entity()
export class Rental extends BaseModelEntity implements IRental {
  @Column()
  rentalNumber: string;

  @Column()
  priceRent: number;

  @Column()
  rentalDate: Date;

  @Column()
  returnDate: Date;

  @Column()
  createdBy: number;

  @Column()
  updatedBy: number;

  @Column()
  deletedBy: number;
}
