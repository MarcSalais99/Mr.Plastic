
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la sucursal es obligatorio' })
  @MinLength(2, {
    message: 'El nombre debe tener al menos 2 caracteres',
  })
  @MaxLength(100, {
    message: 'El nombre no puede superar los 100 caracteres',
  })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'La dirección no puede superar los 255 caracteres',
  })
  address?: string | null;
}
