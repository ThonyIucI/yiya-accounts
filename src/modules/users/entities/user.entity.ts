import { Role } from 'src/modules/data/entities/role.entity';
import { IUser } from 'src/interfaces';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseModelEntity } from 'src/modules/data/entities/base.entity';
import { Rental } from 'src/modules/rentals/entities/rental.entity';

@Entity({ name: 'users' })
export class User extends BaseModelEntity implements IUser {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true, type: 'float' })
  totalPrice: number;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  // Clave foránea a User
  @Column({ name: 'roleId' })
  roleId: number;
  // Relations
  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @OneToMany(() => Rental, (rental) => rental.user)
  rentals: Rental[];
}
