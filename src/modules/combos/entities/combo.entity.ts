import { ICombo } from 'src/interfaces';
import { BaseModelEntity } from 'src/modules/data/entities/base.entity';
import { Column, Entity } from 'typeorm';
@Entity()
export class Combo extends BaseModelEntity implements ICombo {
  @Column()
  price: number;
}
