/**
 * Authentication & Authorization Middleware for Hono
 * Provides elegant RBAC for protecting routes with Cognito JWT tokens
 */

import { createMiddleware } from 'hono/factory';
import type { Context, Next } from 'hono';

// Role types matching Cognito groups
export type UserRole = 'Admins' | 'Users';

// User context from Cognito JWT (passed by API Gateway)
export interface AuthUser {
  sub: string; // User ID
  email: string;
  name?: string;
  groups: UserRole[];
}

/**
 * Extract authenticated user from API Gateway context
 * The Cognito authorizer injects claims into the request context
 */
export function getAuthUser(c: Context): AuthUser | null {
  const event = c.env?.event;
  const claims = event?.requestContext?.authorizer?.claims;

  if (!claims) return null;

  const groups = claims['cognito:groups'];
  return {
    sub: claims.sub,
    email: claims.email,
    name: claims.name,
    groups: Array.isArray(groups) ? groups : groups ? [groups] : [],
  };
}

/**
 * Middleware: Require authentication
 * Use on routes that need a logged-in user
 *
 * @example
 * app.get('/profile', requireAuth(), (c) => { ... })
 */
export const requireAuth = () => {
  return createMiddleware(async (c, next) => {
    const user = getAuthUser(c);

    if (!user) {
      return c.json(
        {
          success: false,
          error: 'Authentication required',
        },
        401,
      );
    }

    // Attach user to context for downstream handlers
    c.set('user', user);
    await next();
  });
};

/**
 * Middleware: Require specific role(s)
 * Use on routes that need specific permissions
 *
 * @example
 * // Single role
 * app.post('/movies', requireRole('Admins'), (c) => { ... })
 *
 * // Multiple roles (OR logic - any role matches)
 * app.get('/bookings', requireRole(['Admins', 'Users']), (c) => { ... })
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return createMiddleware(async (c, next) => {
    const user = getAuthUser(c);

    if (!user) {
      return c.json(
        {
          success: false,
          error: 'Authentication required',
        },
        401,
      );
    }

    const hasRole = user.groups.some((g) => allowedRoles.includes(g));

    if (!hasRole) {
      return c.json(
        {
          success: false,
          error: 'Insufficient permissions',
          required: allowedRoles,
        },
        403,
      );
    }

    c.set('user', user);
    await next();
  });
};

/**
 * Middleware: Admin only shorthand
 *
 * @example
 * app.delete('/movies/:id', adminOnly(), (c) => { ... })
 */
export const adminOnly = () => requireRole('Admins');

/**
 * Helper: Get typed user from context
 * Use in route handlers after auth middleware
 *
 * @example
 * app.get('/profile', requireAuth(), (c) => {
 *   const user = getUser(c)
 *   return c.json({ userId: user.sub })
 * })
 */
export function getUser(c: Context): AuthUser {
  const user = c.get('user') as AuthUser;
  if (!user) throw new Error('User not found - did you forget requireAuth()?');
  return user;
}
