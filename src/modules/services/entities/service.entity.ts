import { IService } from 'src/interfaces';
import { Account } from 'src/modules/accounts/entities/account.entity';
import { BaseModelEntity } from 'src/modules/data/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
@Entity()
export class Service extends BaseModelEntity implements IService {
  @Column({ unique: true })
  name: string;

  @Column()
  profilesNumber: number;

  @Column({ nullable: true })
  logo: string;

  @Column({ type: 'float' })
  originalPurchasePrice: number;

  @OneToMany(() => Account, (account) => account.supplier, {
    cascade: ['soft-remove'],
  })
  account: Account;
}
