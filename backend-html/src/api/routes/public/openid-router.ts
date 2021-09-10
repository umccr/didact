import { Router } from 'express';
import { IRoute } from '../_routes.interface';
import { getMandatoryEnv } from '../../../app-env';
import { URL } from 'url';
import got from 'got';

export class OpenIdRoute implements IRoute {
  public path = '/login';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const loginHost = getMandatoryEnv('LOGIN_HOST');
    const loginClientId = getMandatoryEnv('LOGIN_CLIENT_ID');
    const loginClientSecret = getMandatoryEnv('LOGIN_CLIENT_SECRET');

    this.router.post(`/exchange`, async (req, res, next) => {
      console.log('Code exchange');
      console.log(req.body);
      const referrerUrl = new URL(req.get('referer'));
      referrerUrl.search = '';
      console.log(referrerUrl.href);
      // because we (the backend) have the secrets - we are the only party that can do an code<->token exchange
      // (this is very much NOT NORMAL oauth but in the absence of PKCE - this hybrid approach allows us to
      // continue until PKCE is supported by CIlogon)
      try {
        console.log(`Doing exchange POST to endpoint ${loginHost} with id ${loginClientId} and secret ${loginClientSecret}`);
        const tokenResponse = await got
          .post(`${loginHost}/oauth2/token`, {
            form: {
              grant_type: 'authorization_code',
              client_secret: loginClientSecret,
              client_id: loginClientId,
              // note: this redirect is not actually used but must be specified and match one in the config
              redirect_uri: referrerUrl.href,
              // redirect_uri: 'http://localhost:3000/login/callback',
              code: req.body.code,
            },
          })
          .json();
        res.status(200).json(tokenResponse);
      } catch (error) {
        console.log('Code exchange failed');

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
}
