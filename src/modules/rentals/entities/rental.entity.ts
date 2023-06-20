import { Type } from 'class-transformer';
import { IRental } from 'src/interfaces';
import { User } from 'src/modules/users/entities/user.entity';
import { Combo } from 'src/modules/combos/entities/combo.entity';
import { BaseModelEntity } from 'src/modules/data/entities/base.entity';
import { RentalStatus } from 'src/modules/data/entities/rentalStatus.entity';
import { Profile } from 'src/modules/profiles/entities/profile.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
@Entity()
export class Rental extends BaseModelEntity implements IRental {
  @Column()
  rentalCode: string;

  @Column()
  priceRent: number;

  @Type(() => Date)
  @Column('text')
  rentalDate: Date;

  @Type(() => Date)
  @Column('text')
  returnDate: Date;

  @Column()
  createdBy: number;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ nullable: true })
  deletedBy: number;

  @Column({ name: 'userId' })
  userId: number;

  @ManyToOne(() => User, (user) => user.rentals)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true, name: 'comboId' })
  comboId: number;

  @OneToOne(() => Combo)
  @JoinColumn()
  combo: Combo;

  @Column({ name: 'statusId' })
  statusId: number;

  @OneToOne(() => RentalStatus)
  @JoinColumn({ name: 'statusId' })
  rentalStatus: RentalStatus;

  @OneToMany(() => Profile, (profile) => profile.rental)
  profiles: Profile[];
}
