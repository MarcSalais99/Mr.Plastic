
import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

import type { Request } from 'express';
import type { JwtPayload } from '../strategies/jwt.strategy.js';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload => {
    const request =
      context.switchToHttp().getRequest<RequestWithUser>();

    return request.user;
  },
);
