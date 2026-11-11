
import { Type } from 'class-transformer';
import {
  IsInt,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateBranchInventoryDto {
  @IsUUID('4', {
    message: 'El identificador de la sucursal debe ser un UUID válido',
  })
  branchId!: string;

  @IsUUID('4', {
    message: 'El identificador del producto debe ser un UUID válido',
  })
  productId!: string;

  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  quantity!: number;
}
