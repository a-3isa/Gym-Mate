import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../../firebase/services/auth.service';
import type { Request } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';

interface AuthenticatedRequest extends Request {
  headers: Request['headers'] & { authorization?: string };
  user?: DecodedIdToken;
}

/**
 * Guard that validates Firebase ID tokens for protected routes.
 *
 * This guard extracts the Firebase ID token from the Authorization header,
 * verifies it using Firebase Admin SDK, and attaches the decoded user
 * information to the request object for downstream access.
 *
 * @example
 * ```typescript
 * @Controller('protected')
 * export class ProtectedController {
 *   @Get('data')
 *   @UseGuards(FirebaseAuthGuard)
 *   async getProtectedData(@CurrentUser() user) {
 *     return { message: 'Protected data', user };
 *   }
 * }
 * ```
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (typeof authorization !== 'string') {
      throw new UnauthorizedException('Authorization header is missing');
    }

    if (!authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header must start with Bearer');
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    try {
      // Verify the ID token using Firebase Admin SDK
      const decodedToken = await this.authService.verifyIdToken(token);

      // Attach the decoded token to the request for downstream access
      request.user = decodedToken;

      this.logger.debug(`Authenticated user: ${decodedToken.uid}`);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Token verification failed: ${message}`);

      // Handle specific Firebase Auth errors
      if (this.isFirebaseAuthError(error)) {
        const code = error.code;
        if (code === 'auth/id-token-expired') {
          throw new UnauthorizedException('Token has expired');
        } else if (code === 'auth/id-token-revoked') {
          throw new UnauthorizedException('Token has been revoked');
        } else if (code === 'auth/argument-error') {
          throw new UnauthorizedException('Invalid token format');
        } else if (code === 'auth/invalid-id-token') {
          throw new UnauthorizedException('Invalid token');
        }
      }

      // Generic error for any other cases
      throw new UnauthorizedException('Token verification failed');
    }
  }

  private isFirebaseAuthError(error: unknown): error is { code: string } {
    return typeof error === 'object' && error !== null && 'code' in error;
  }
}
