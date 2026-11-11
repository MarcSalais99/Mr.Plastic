
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInventoryMovementDto {
  @IsUUID('4', {
    message: 'El identificador de la sucursal debe ser un UUID válido',
  })
  branchId!: string;

  @IsUUID('4', {
    message: 'El identificador del producto debe ser un UUID válido',
  })
  productId!: string;

  @IsString({ message: 'El tipo de movimiento debe ser texto' })
  @IsIn(['ENTRY', 'EXIT'], {
    message: 'El tipo de movimiento debe ser ENTRY o EXIT',
  })
  movementType!: 'ENTRY' | 'EXIT';

  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser mayor que cero' })
  quantity!: number;

  @IsOptional()
  @IsString({ message: 'El tipo de referencia debe ser texto' })
  @MaxLength(50, {
    message: 'El tipo de referencia no puede superar los 50 caracteres',
  })
  referenceType?: string | null;

  @IsOptional()
  @IsUUID('4', {
    message: 'El identificador de referencia debe ser un UUID válido',
  })
  referenceId?: string | null;
}
