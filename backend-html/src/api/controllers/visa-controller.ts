import { NextFunction, Request, Response } from 'express';
import { datasetServiceInstance } from '../../business/services/dataset.service';
import { makeVisaSigned } from '../../business/services/visa/make-visa';
import { keyDefinitions } from '../../business/services/visa/keys';
import { wellKnownRouter } from '../routes/well-known-router';

export class VisaController {
  /**
   * API call to retrieve visas for a particular user id.
   *
   * @param req
   * @param res
   * @param next
   */
  public getForUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      /*
        this would not be real but for the moment showing exposing test visas
      */
      const results = [];

      // make visas representing the test vector input of the various RFCs (to check signatures are right)
      results.push(makeVisaSigned(keyDefinitions, 'c:12345 r.p:#r1', 'patto-kid1'));

      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  };

  public getTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const results = [];

      // make visas representing the test vector input of the various RFCs (to check signatures are right)
      results.push(makeVisaSigned(keyDefinitions, '', 'rfc8032-7.1-test1'));
      results.push(makeVisaSigned(keyDefinitions, 'r', 'rfc8032-7.1-test2'));

      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  };
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
