import { Router } from 'express';
import { IRoute } from '../_routes.interface';
import { URL } from 'url';
import { add, getUnixTime } from 'date-fns';
import cryptoRandomString from 'crypto-random-string';
import { applicationServiceInstance } from '../../../business/services/application.service';
import { makeVisaSigned } from '../../../business/services/visa/make-visa';
import { keyDefinitions } from '../../../business/services/visa/keys';
import { jwtVerify } from 'jose/jwt/verify';
import { createRemoteJWKSet } from 'jose/jwks/remote';
import { SignJWT } from 'jose/jwt/sign';
import { parseJwk } from 'jose/jwk/parse';
import { RsaJose } from '../../../business/services/visa/rsa-jose';
import { ldapClientPromise, ldapSearchPromise } from '../../../business/services/_ldap.utils';

const EXCHANGE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:token-exchange';

const TOKEN_TYPE_GA4GH_COMPACT = 'urn:ga4gh:token-type:compact-passport';
const TOKEN_TYPE_IETF_ACCESS = 'urn:ietf:params:oauth:token-type:access_token';

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
    this.router.post(`/token`, async (req, res) => {
      try {
        if (req.body.grant_type != EXCHANGE_GRANT_TYPE)
          throw new Error(`The only grant type configured is token exchange - not '${req.body.grant_type}'`);

        if (req.body.subject_token_type != TOKEN_TYPE_IETF_ACCESS) throw new Error('Can only do token exchange of JWT access tokens');

        if (req.body.requested_token_type != TOKEN_TYPE_GA4GH_COMPACT) throw new Error('Can only do token exchange for 4k passports');

        const payload = await this.verifyIncomingCiLogon(req.body.subject_token);

        // if we have got here then we know that we have received a validated JWT signed by cilogon

        let subjectId: string = payload.sub;

        // correct subject ids..
        if (subjectId == 'http://cilogon.org/serverT/users/51509288') subjectId = 'https://nagim.dev/p/iryba-kskqa-10000';
        if (subjectId == 'http://cilogon.org/serverT/users/51505493') subjectId = 'https://nagim.dev/p/mbcxw-bpjwv-10000';

        const claims = {
          ga4gh: {
            vn: '1.2',
            iss: {
              // this is cheating slightly.. a real broker should possibly be going off via https to talk to other visa issuers
              'https://didact-patto.dev.umccr.org': await this.getDidactVisas(subjectId),
              // this is some visas based off ldap grouping
              'https://broker.nagim.dev': await this.getNagimVisas(subjectId),
            },
          },
        };

        const newJwtSigner = new SignJWT(claims)
          .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: 'rfc-rsa' })
          .setSubject(subjectId)
          .setIssuedAt()
          .setIssuer('https://broker.nagim.dev')
          .setExpirationTime('365d')
          .setJti(cryptoRandomString({ length: 16 }));

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
          issued_token_type: TOKEN_TYPE_GA4GH_COMPACT,
          token_type: 'Bearer',
          expires_in: 60 * 60,
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
        res.status(500).json({ message: 'Code exchange failed', detail: error });
      }
    });
  }

  private async verifyIncomingCiLogon(jwt: string): Promise<any> {
    if (!jwt) throw new Error('A subject token must be provider');

    const JWKS = createRemoteJWKSet(new URL('https://test.cilogon.org/oauth2/certs'));

    const { payload } = await jwtVerify(jwt, JWKS, {
      issuer: 'https://test.cilogon.org',
    });

    return payload;
  }

  private async getNagimVisas(subjectId: string): Promise<any> {
    const expiryDate = add(new Date(), {
      days: 365,
    });

    const visaJti = cryptoRandomString({ length: 32 });
    const visaAssertions: string[] = [];

    const client = await ldapClientPromise();
    const x = await ldapSearchPromise(client, 'o=NAGIMdev,o=CO,dc=biocommons,dc=org,dc=au', {
      filter: '&(objectClass=voPerson)(isMemberOf=Trusted Researchers)',
      scope: 'sub',
      attributes: ['voPersonID'],
    });

    for (const trustedResult of x || []) {
      if (trustedResult.voPersonID === subjectId) visaAssertions.push('r:trusted_researcher');
    }

    visaAssertions.push(`et:${getUnixTime(expiryDate)}`, `iu:${subjectId}`, `iv:${visaJti}`);
    visaAssertions.sort();

    console.log(`Looking for trusted researcher status for ${subjectId} resulted in visa assertions '${visaAssertions}'`);

    return makeVisaSigned(keyDefinitions, visaAssertions.join(' '), 'rfc8032-7.1-test1');
  }

  private async getDidactVisas(subjectId: string): Promise<any> {
    const expiryDate = add(new Date(), {
      days: 365,
    });

    const visaJti = cryptoRandomString({ length: 16 });

    const visaAssertions: string[] = [];

    for (const d of await applicationServiceInstance.findApprovedApplicationsInvolvedAsApplicant(subjectId)) visaAssertions.push(`c:${d}`);

    visaAssertions.push(`et:${getUnixTime(expiryDate)}`, `iu:${subjectId}`, `iv:${visaJti}`);
    visaAssertions.sort();

    console.log(`Looking for approved datasets for ${subjectId} resulted in visa assertions '${visaAssertions}'`);

    return makeVisaSigned(keyDefinitions, visaAssertions.join(' '), 'rfc8032-7.1-test1');
  }
}

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
