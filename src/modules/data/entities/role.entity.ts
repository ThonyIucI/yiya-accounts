import { IRole } from 'src/interfaces';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Role implements IRole {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
}
