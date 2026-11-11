
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'El código SKU es obligatorio' })
  @MaxLength(50, {
    message: 'El SKU no puede superar los 50 caracteres',
  })
  sku: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @MinLength(2, {
    message: 'El nombre debe tener al menos 2 caracteres',
  })
  @MaxLength(150, {
    message: 'El nombre no puede superar los 150 caracteres',
  })
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30, {
    message: 'La unidad no puede superar los 30 caracteres',
  })
  unit?: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;
}
