import { IProfile } from 'src/interfaces';
import { BaseModelEntity } from 'src/modules/data/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class Profile extends BaseModelEntity implements IProfile {
  @Column()
  available: boolean;

  @Column()
  pin: string;

  @Column()
  priceRent: number;

  @Column()
  profileName: string;
}
