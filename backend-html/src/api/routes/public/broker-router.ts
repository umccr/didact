import { Router } from 'express';
import { IRoute } from '../_routes.interface';
import { getMandatoryEnv } from '../../../app-env';
import { URL } from 'url';
import got from 'got';
import { VisaController } from '../../controllers/visa-controller';
import { add, getUnixTime } from 'date-fns';
import cryptoRandomString from 'crypto-random-string';
import { applicationServiceInstance } from '../../../business/services/application.service';
import { makeVisaSigned } from '../../../business/services/visa/make-visa';
import { keyDefinitions } from '../../../business/services/visa/keys';
import { jwtVerify } from 'jose/jwt/verify';
import { createRemoteJWKSet } from 'jose/jwks/remote';
import _ from 'lodash';
import { SignJWT } from 'jose/jwt/sign';
import { parseJwk } from 'jose/jwk/parse';
import { RsaJose } from '../../../business/services/visa/rsa-jose';

/**
 * A temporary endpoint that acts to re-sign access JWTs from CILogon, but instead
 * with passports inside.
 */
export class BrokerRoute implements IRoute {
  public path = '/broker';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`/exchange`, async (req, res, next) => {
      try {
        if (req.body.grant_type != 'urn:ietf:params:oauth:grant-type:token-exchange') throw new Error('Can only do token exchange');

        if (req.body.subject_token_type != 'urn:ietf:params:oauth:token-type:access_token')
          throw new Error('Can only do token exchange of JWT access tokens');

        if (req.body.requested_token_type != 'urn:ga4gh:token-type:self-contained-passport')
          throw new Error('Can only do token exchange for 4k passports');

        const jwt = req.body.subject_token;

        const JWKS = createRemoteJWKSet(new URL('https://cilogon.org/oauth2/certs'));

        const { payload, protectedHeader } = await jwtVerify(jwt, JWKS, {
          issuer: 'https://test.cilogon.org',
        });

        const subjectId = payload.sub;
        const claims = {
          ga4gh: {
            vn: '1.2',
            iss: {
              'https://didact-patto.dev.umccr.org': await this.getVisa(subjectId),
            },
          },
        };

        const newJwtSigner = new SignJWT(claims);
        newJwtSigner.setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: 'rfc-rsa' });
        newJwtSigner.setSubject(payload.sub);
        newJwtSigner.setIssuedAt();
        newJwtSigner.setIssuer('https://didact-patto.dev.umccr.org');
        newJwtSigner.setExpirationTime('2h');
        newJwtSigner.setJti(cryptoRandomString({ length: 16 }));

        const srcKey = keyDefinitions['rfc-rsa'] as RsaJose;

        const srcKeyAsPrivateJwk = {
          alg: 'RS256',
          kty: 'RSA',
          e: srcKey.e,
          n: srcKey.n,
          d: srcKey.dBase64Url,
          p: srcKey.pBase64Url,
          q: srcKey.qBase64Url,
          dp: srcKey.dpBase64Url,
          dq: srcKey.dqBase64Url,
          qi: srcKey.qiBase64Url,
        };

        const rsaPrivateKey = await parseJwk(srcKeyAsPrivateJwk);

        const newJwt = await newJwtSigner.sign(rsaPrivateKey);

        res.status(200).json({
          access_token: newJwt,
          issued_token_type: 'urn:ga4gh:token-type:self-contained-passport',
          token_type: 'Bearer',
          expires_in: 60,
        });
      } catch (error) {
        console.log('Token exchange failed');

        if (error.response) {
          /*
           * The request was made and the server responded with a
           * status code that falls out of the range of 2xx
           */
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          /*
           * The request was made but no response was received, `error.request`
           * is an instance of XMLHttpRequest in the browser and an instance
           * of http.ClientRequest in Node.js
           */
          console.log(error.request);
        } else {
          // Something happened in setting up the request and triggered an Error
          console.log('Error', error.message);
        }
        console.log(error);
        res.status(500).json({ message: 'Code exchange failed' });
      }
    });
  }

  private async getVisa(subjectId: string): Promise<any> {
    const expiryDate = add(new Date(), {
      days: 1,
    });

    const visaJti = cryptoRandomString({ length: 16 });

    const visaAssertions: string[] = [];

    console.log(`Looking for approved datasets for subject ${subjectId}`);

    for (const d of await applicationServiceInstance.findApprovedApplicationsInvolvedAsApplicant(subjectId)) visaAssertions.push(`c:${d}`);

    visaAssertions.push(`et:${getUnixTime(expiryDate)}`, `iu:${subjectId}`, `iv:${visaJti}`);
    visaAssertions.sort();

    return makeVisaSigned(keyDefinitions, visaAssertions.join(' '), 'rfc8032-7.1-test1');
  }
}

/*
wellKnownRouter.get(`/passport`, async (req, res, next) => {
  const payload = {
    sub: 'me',
    scope: 'ga4gh offline',
    jti: 'adsasdadadasd',
    ga4gh: {
      vn: '1.0',
      iss: {
        'https://didact-patto.dev.umccr.org': [makeVisaSigned(keyDefinitions, 'c:12345 r.p:#r1', 'patto-kid1')],
      },
    },
  };

  const { publicKey, privateKey } = await generateKeyPair('PS256');

  const encoder = new TextEncoder();

  const sign = new GeneralSign(encoder.encode(JSON.stringify(payload)));

  //sign
  //    .addSignature(ecPrivateKey)
  //    .setProtectedHeader({ alg: 'ES256' })

  sign.addSignature(privateKey).setProtectedHeader({ alg: 'PS256' });

  const jws = await sign.sign();

  res.status(200).json(jws);
});

 */

// grant_type
//       REQUIRED.  The value "urn:ietf:params:oauth:grant-type:token-
//       exchange" indicates that a token exchange is being performed.
//
//    resource
//       OPTIONAL.  A URI that indicates the target service or resource
//       where the client intends to use the requested security token.
//       This enables the authorization server to apply policy as
//       appropriate for the target, such as determining the type and
//       content of the token to be issued or if and how the token is to be
//       encrypted.  In many cases, a client will not have knowledge of the
//       logical organization of the systems with which it interacts and
//       will only know a URI of the service where it intends to use the
//       token.  The "resource" parameter allows the client to indicate to
//       the authorization server where it intends to use the issued token
//       by providing the location, typically as an https URL, in the token
//       exchange request in the same form that will be used to access that
//       resource.  The authorization server will typically have the
//       capability to map from a resource URI value to an appropriate
//       policy.  The value of the "resource" parameter MUST be an absolute
//       URI, as specified by Section 4.3 of [RFC3986], that MAY include a
//       query component and MUST NOT include a fragment component.
//       Multiple "resource" parameters may be used to indicate that the
//       issued token is intended to be used at the multiple resources
//       listed.  See [OAUTH-RESOURCE] for additional background and uses
//       of the "resource" parameter.
//
//    audience
//       OPTIONAL.  The logical name of the target service where the client
//       intends to use the requested security token.  This serves a
//       purpose similar to the "resource" parameter but with the client
//       providing a logical name for the target service.  Interpretation
//       of the name requires that the value be something that both the
//       client and the authorization server understand.  An OAuth client
//       identifier, a SAML entity identifier [OASIS.saml-core-2.0-os], and
//       an OpenID Connect Issuer Identifier [OpenID.Core] are examples of
//       things that might be used as "audience" parameter values.
//       However, "audience" values used with a given authorization server
//       must be unique within that server to ensure that they are properly
//       interpreted as the intended type of value.  Multiple "audience"
//       parameters may be used to indicate that the issued token is
//       intended to be used at the multiple audiences listed.  The
//       "audience" and "resource" parameters may be used together to
//       indicate multiple target services with a mix of logical names and
//       resource URIs.
//
//    scope
//       OPTIONAL.  A list of space-delimited, case-sensitive strings, as
//       defined in Section 3.3 of [RFC6749], that allow the client to
//       specify the desired scope of the requested security token in the
//       context of the service or resource where the token will be used.
//       The values and associated semantics of scope are service specific
//       and expected to be described in the relevant service
//       documentation.
//
//    requested_token_type
//       OPTIONAL.  An identifier, as described in Section 3, for the type
//       of the requested security token.  If the requested type is
//       unspecified, the issued token type is at the discretion of the
//       authorization server and may be dictated by knowledge of the
//       requirements of the service or resource indicated by the
//       "resource" or "audience" parameter.
//
//    subject_token
//       REQUIRED.  A security token that represents the identity of the
//       party on behalf of whom the request is being made.  Typically, the
//       subject of this token will be the subject of the security token
//       issued in response to the request.
//
//    subject_token_type
//       REQUIRED.  An identifier, as described in Section 3, that
//       indicates the type of the security token in the "subject_token"
//       parameter.
//
//    actor_token
//       OPTIONAL.  A security token that represents the identity of the
//       acting party.  Typically, this will be the party that is
//       authorized to use the requested security token and act on behalf
//       of the subject.
//
//    actor_token_type
//       An identifier, as described in Section 3, that indicates the type
//       of the security token in the "actor_token" parameter.  This is
//       REQUIRED when the "actor_token" parameter is present in the
//       request but MUST NOT be included otherwise.
