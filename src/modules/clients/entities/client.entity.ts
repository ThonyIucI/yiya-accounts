import { IClient } from 'src/interfaces';
import { BaseModelEntity } from 'src/modules/data/entities/base.entity';
import { Column, Entity } from 'typeorm';
@Entity()
export class Client extends BaseModelEntity implements IClient {
  @Column()
  firstName: string;

  @Column({ type: 'text' })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  totalPrice: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  others: string;
}
