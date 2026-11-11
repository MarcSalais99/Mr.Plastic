
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(255, {
    message: 'El correo electrónico no puede superar los 255 caracteres',
  })
  email!: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(1, { message: 'La contraseña es obligatoria' })
  @MaxLength(128, {
    message: 'La contraseña no puede superar los 128 caracteres',
  })
  password!: string;
}
