import { NextFunction, Request, Response } from 'express';
import { applicationServiceInstance } from '../../business/services/application.service';
import { ApplicationApiModel } from '../../../../shared-src/api-models/application';

/**
 * A controller for the application, that maps between API activity and calls to the underlying
 * business service.
 */
export class ApplicationController {
  public getApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appId = req.params.applicationId;

      const data = await applicationServiceInstance.asApplication(appId);

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public newApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // pretend at this point we decode the Bearer auth token
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const user = req.headers.authorization.split(' ')[1];

        const input: ApplicationApiModel = req.body;

        const data = await applicationServiceInstance.createNew(
          // we override whatever is specified in the packet - the applicant is *always* the logged in user
          user,
          input.principalInvestigatorId,
          input.datasetId,
          input.projectTitle,
        );

        res.status(200).json(data);
      } else res.status(401).json('Bearer token was missing');
    } catch (error) {
      next(error);
    }
  };

  public approveApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // pretend at this point we decode the Bearer auth token
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const user = req.headers.authorization.split(' ')[1];
        const appId = req.params.applicationId;
        const data = await applicationServiceInstance.approveApplication(appId, user);

        res.status(200).json(data);
      } else res.status(401).json('Bearer token was missing');
    } catch (error) {
      next(error);
    }
  };

  public unapproveApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // pretend at this point we decode the Bearer auth token
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const user = req.headers.authorization.split(' ')[1];
        const appId = req.params.applicationId;
        const data = await applicationServiceInstance.unapproveApplication(appId, user);

        res.status(200).json(data);
      } else res.status(401).json('Bearer token was missing');
    } catch (error) {
      next(error);
    }
  };

  public submitApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // pretend at this point we decode the Bearer auth token
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const user = req.headers.authorization.split(' ')[1];
        const appId = req.params.applicationId;
        const data = await applicationServiceInstance.submitApplication(appId, user);

        res.status(200).json(data);
      } else res.status(401).json('Bearer token was missing');
    } catch (error) {
      next(error);
    }
  };

  /**
   * API call to retrieve all the datasets available.
   *
   * @param req
   * @param res
   * @param next
   */
  public listApplicationsAsResearcher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // pretend at this point we decode the Bearer auth token
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const user = req.headers.authorization.split(' ')[1];

        const data = await applicationServiceInstance.listByUserAsResearcher(user);

        res.status(200).json(data);
      } else res.status(401).json('Bearer token was missing');
    } catch (error) {
      next(error);
    }
  };

  public listApplicationsAsCommittee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const user = req.headers.authorization.split(' ')[1];

        const data = await applicationServiceInstance.listByUserAsCommittee(user);

        res.status(200).json(data);
      } else res.status(401).json('Bearer token was missing');
    } catch (error) {
      next(error);
    }
  };
}
