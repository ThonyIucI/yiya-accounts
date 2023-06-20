import { IProfile } from 'src/interfaces';
import { Account } from 'src/modules/accounts/entities/account.entity';
import { BaseModelEntity } from 'src/modules/data/entities/base.entity';
import { Rental } from 'src/modules/rentals/entities/rental.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class Profile extends BaseModelEntity implements IProfile {
  @Column({ default: true })
  available: boolean;

  @Column({ nullable: true })
  pin: string;

  @Column()
  priceRent: number;

  @Column()
  profileName: string;

  @Column({ name: 'accountId' })
  accountId: number;

  @ManyToOne(() => Account, (account) => account.profiles, {
    cascade: ['soft-remove'],
  })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ name: 'rentalId', nullable: true })
  rentalId: number;

  @ManyToOne(() => Rental, (rental) => rental.profiles)
  @JoinColumn({ name: 'rentalId' })
  rental: Rental;
}
