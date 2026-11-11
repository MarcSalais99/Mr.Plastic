
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';
import { Roles } from './decorators/roles.decorator.js';
import { RolesGuard } from './guards/roles.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    const accessToken = await this.jwtService.signAsync({
  sub: user.id,
  email: user.email,
  role: user.role,
  branchId: user.branchId,
});

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 900,
      user,
    };
  }

 @Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: JwtPayload) {
  return {
    message: 'Autenticación correcta',
    user,
  };
}

@Get('admin-test')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin_general')
adminTest() {
  return {
    message: 'Acceso autorizado',
    role: 'admin_general',
  };
} 
}
