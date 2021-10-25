import jwt from 'express-jwt';
import { expressJwtSecret } from 'jwks-rsa';

export function createJwksCallback(): jwt.SecretCallbackLong {
  return expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: 'https://broker.nagim.dev/.well-known/jwks', // 'https://cilogon.org/oauth2/certs',
  });
}

export function createJwtMiddleware(callback: jwt.SecretCallbackLong) {
  return jwt({
    secret: callback,
    algorithms: ['RS256'],
    issuer: 'https://broker.nagim.dev', // https://test.cilogon.org',
    // consider audience here as well
  });
}
