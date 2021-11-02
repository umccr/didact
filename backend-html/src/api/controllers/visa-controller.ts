import { NextFunction, Request, Response } from 'express';
import { makeVisaSigned } from '../../business/services/visa/make-visa';
import { keyDefinitions } from '../../business/services/visa/keys';
import { getUnixTime, add } from 'date-fns';
import cryptoRandomString from 'crypto-random-string';
import { applicationServiceInstance } from '../../business/services/application/application.service';
import { URLSearchParams } from 'url';

export class VisaController {
  /**
   * API call to retrieve visas for a particular subject id.
   *
   * @param req
   * @param res
   * @param next
   */
  public getForUser = async (req: Request<unknown, unknown, unknown, URLSearchParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
      /*
      not yet real endpoint mainly for testing
      */
      const results = [];

      // rather than fail on missing subject - we want the same behaviour as an unknown subject - just
      // fall through and returned nothing
      if (req.query.has('sub')) {
        const subjectId = req.query.get('sub');

        const visaAssertions: string[] = [];

        console.log(`Looking for approved datasets for subject ${subjectId}`);

        for (const d of await applicationServiceInstance.findApprovedApplicationsInvolvedAsApplicant(subjectId)) visaAssertions.push(`c:${d}`);

        // only if we actually find some datasets should we bother making a visa
        if (visaAssertions.length > 0) {
          results.push(makeVisaSigned(keyDefinitions, 'rfc8032-7.1-test1', subjectId, { days: 1 }, visaAssertions));
        }
      }

      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  };

  /**
   * An endpoint exposing some essentially static visas for test purposes.
   *
   * @param req
   * @param res
   * @param next
   */
  public getTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const results = [];

      // make visas representing the test vector input of the various RFCs (to check signatures are right)
      results.push(makeVisaSigned(keyDefinitions, 'rfc8032-7.1-test1', 'subjecta', { hours: 1 }, ['a:b']));
      results.push(makeVisaSigned(keyDefinitions, 'rfc8032-7.1-test2', 'subjectb', { hours: 1 }, ['test:assert']));

      // make some more realistic actual visas
      results.push(
        makeVisaSigned(keyDefinitions, 'rfc8032-7.1-test1', 'subjectc', { hours: 1 }, [`c:urn:fdc:australiangenomics.org.au:2018:study/1`]),
      );
      results.push(makeVisaSigned(keyDefinitions, 'rfc8032-7.1-test1', 'subjectd', { hours: 1 }, ['r:https://doi.org/10.1038/s41431-018-0219-y']));

      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  };
}
