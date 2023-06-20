import { IsArray, IsNotEmpty, isNotEmpty } from 'class-validator';

export class CreateRentalDto {
  @IsNotEmpty({ message: 'El cliente es requerido' })
  clientId: number;
  @IsArray({ message: 'Debe incluir un array de ids' })
  profilesIds: number[];
}
