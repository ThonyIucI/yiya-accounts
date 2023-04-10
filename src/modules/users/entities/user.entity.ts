import { Role } from 'src/modules/data/entities/role.entity';
import { IUser } from 'src/interfaces';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseModelEntity } from 'src/modules/data/entities/base.entity';

@Entity({ name: 'users' })
export class User extends BaseModelEntity implements IUser {
  @Column()
  name: string;
  @Column()
  lastName: string;
  @Column({ unique: true })
  email: string;
  @Column()
  password: string;

  // Relations
  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleId' })
  role: Role;
}
