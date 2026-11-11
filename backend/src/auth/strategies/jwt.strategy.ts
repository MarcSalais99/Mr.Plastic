
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { User } from '../../users/entities/user.entity.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  branchId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_SECRET debe estar configurado y tener al menos 32 caracteres',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (
      !payload ||
      typeof payload.sub !== 'string'
    ) {
      throw new UnauthorizedException('Token inválido');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
      relations: { branch: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branch?.id ?? null,
    };
  }
}
