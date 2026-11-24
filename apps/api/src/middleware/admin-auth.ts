import { adminUsers } from '@preppal/db';
import type { Role } from '@preppal/shared';
import { eq } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AppEnv } from '../env';
import { HttpError } from '../lib/errors';

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * Admin auth = Cloudflare Access (Zero Trust, free ≤50 users) in front of the admin hostname.
 * Access performs the login (email one-time PIN) and forwards a signed JWT in
 * `Cf-Access-Jwt-Assertion`. We verify it, then require the email to be an active row in admin_users.
 * No passwords are stored or hashed in our code (keeps CPU well under the free-plan 10 ms limit).
 *
 * Local dev: when ENVIRONMENT=development and DEV_ADMIN_EMAIL is set, the JWT check is skipped.
 */
export const requireAdmin = (roles: readonly Role[] = ['owner', 'staff']) =>
  createMiddleware<AppEnv>(async (c, next) => {
    let email: string | undefined;

    if (c.env.ENVIRONMENT === 'development' && c.env.DEV_ADMIN_EMAIL) {
      email = c.env.DEV_ADMIN_EMAIL;
    } else {
      const token = c.req.header('Cf-Access-Jwt-Assertion');
      if (!token) throw new HttpError(401, 'unauthenticated', 'Sign in required');
      const certsUrl = `${c.env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`;
      let jwks = jwksCache.get(certsUrl);
      if (!jwks) {
        jwks = createRemoteJWKSet(new URL(certsUrl));
        jwksCache.set(certsUrl, jwks);
      }
      try {
        const { payload } = await jwtVerify(token, jwks, {
          issuer: c.env.ACCESS_TEAM_DOMAIN,
          audience: c.env.ACCESS_AUD,
        });
        email = typeof payload.email === 'string' ? payload.email.toLowerCase() : undefined;
      } catch {
        throw new HttpError(401, 'unauthenticated', 'Invalid or expired session');
      }
    }

    if (!email) throw new HttpError(401, 'unauthenticated', 'Sign in required');
    const db = c.get('db');
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    if (!user?.isActive) throw new HttpError(403, 'forbidden', `${email} is not an admin`);
    if (!roles.includes(user.role)) throw new HttpError(403, 'forbidden', 'Your role cannot do this');

    c.set('admin', { id: user.id, email: user.email, name: user.name, role: user.role });
    await next();
  });
