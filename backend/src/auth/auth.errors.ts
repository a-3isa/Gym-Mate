/**
 * Custom error classes for auth service operations
 */

export class UserNotFoundError extends Error {
  readonly code = 'USER_NOT_FOUND';

  constructor(message: string = 'User not found') {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

export class AlreadyFriendsError extends Error {
  readonly code = 'ALREADY_FRIENDS';

  constructor(message: string = 'Already friends with this user') {
    super(message);
    this.name = 'AlreadyFriendsError';
  }
}

export class SelfAddForbiddenError extends Error {
  readonly code = 'SELF_ADD_FORBIDDEN';

  constructor(message: string = 'Cannot add yourself as a friend') {
    super(message);
    this.name = 'SelfAddForbiddenError';
  }
}
