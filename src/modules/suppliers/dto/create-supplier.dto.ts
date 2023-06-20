import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSupplierDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;
}
