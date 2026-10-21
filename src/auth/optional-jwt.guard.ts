import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers?.authorization;
    if (!header) return true;

    try {
      await super.canActivate(context);
    } catch {
      return true;
    }

    return true;
  }

  handleRequest<TUser>(_err: unknown, user: TUser): TUser | null {
    return user ?? null;
  }
}
