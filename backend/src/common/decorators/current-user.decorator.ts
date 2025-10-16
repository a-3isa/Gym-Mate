import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';

interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken & {
    name?: string;
    displayName?: string;
    picture?: string;
  };
}

/**
 * Custom parameter decorator to extract the authenticated user from the request.
 * This decorator should be used in conjunction with FirebaseAuthGuard.
 *
 * @example
 * ```typescript
 * @UseGuards(FirebaseAuthGuard)
 * @Get('me')
 * async getProfile(@CurrentUser() user: DecodedIdToken) {
 *   return user;
 * }
 * ```
 *
 * @returns An object containing uid, email, and optionally displayName from the decoded Firebase token
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  const user = request.user;

  if (!user) {
    return null;
  }

  // Extract relevant user information from the decoded Firebase token
  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.name ?? user.displayName ?? undefined,
    emailVerified: user.email_verified ?? false,
    picture: user.picture ?? undefined,
  };
});
