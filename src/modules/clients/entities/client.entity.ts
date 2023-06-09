import { IClient } from 'src/interfaces';
import { BaseModelEntity } from 'src/modules/data/entities/base.entity';
import { Rental } from 'src/modules/rentals/entities/rental.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
@Entity()
export class Client extends BaseModelEntity implements IClient {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column()
  totalPrice: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  others: string;

  @OneToMany(() => Rental, (rental) => rental.client)
  rentals: Rental[];
}
