import { ISupplier } from 'src/interfaces';
import { Account } from 'src/modules/accounts/entities/account.entity';
import { BaseModelEntity } from 'src/modules/data/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
@Entity()
export class Supplier extends BaseModelEntity implements ISupplier {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => Account, (account) => account.supplier, {
    cascade: ['soft-remove'],
  })
  accounts: Account[];
}
