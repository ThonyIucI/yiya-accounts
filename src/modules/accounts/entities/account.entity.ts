import { Type } from 'class-transformer';
import { IAccount } from 'src/interfaces';
import { BaseModelEntity } from 'src/modules/data/entities/base.entity';
import { Profile } from 'src/modules/profiles/entities/profile.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { Supplier } from 'src/modules/suppliers/entities/supplier.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
@Entity()
export class Account extends BaseModelEntity implements IAccount {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  purchasePrice: number;

  @Column()
  profilePrice: number;

  @Type(() => Date)
  @Column('text')
  purchaseDate: Date;

  @Type(() => Date)
  @Column('text')
  expirationDate: Date;

  @Column({ name: 'supplierId' })
  supplierId: number;

  @ManyToOne(() => Supplier, (supplier) => supplier.accounts, {
    cascade: ['soft-remove'],
  })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Column({ name: 'serviceId' })
  serviceId: number;

  @ManyToOne(() => Service, (service) => service.account, {
    cascade: ['soft-remove'],
  })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @OneToMany(() => Profile, (profile) => profile.account, {
    cascade: ['soft-remove'],
  })
  profiles: Profile[];
}
