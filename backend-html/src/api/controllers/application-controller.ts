import { NextFunction, Request, Response } from 'express';
import { applicationServiceInstance } from '../../business/services/application.service';
import { ApplicationApiModel } from '../../../../shared-src/api-models/application';
import { ReleaseManifestApiModel, ReleaseManifestArtifactApiModel } from '../../../../shared-src/api-models/release';
import { getAuthUser } from './_controller.utils';

/**
 * A controller for the application, that maps between API activity and calls to the underlying
 * business service.
 */
export class ApplicationController {
  public getApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getAuthUser(req, res, next);
      // TBD check security on user being involved with this application
      const appId = req.params.applicationId;

      const data = await applicationServiceInstance.asApplication(appId);

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public newApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getAuthUser(req, res, next);
      const input: ApplicationApiModel = req.body;

      const data = await applicationServiceInstance.createNew(
        // we override whatever is specified in the packet - the applicant is *always* the logged in user
        user,
        input.principalInvestigatorId,
        input.datasetId,
        input.projectTitle,
      );

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public approveApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getAuthUser(req, res, next);
      const appId = req.params.applicationId;
      const data = await applicationServiceInstance.approveApplication(appId, user);

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public unapproveApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getAuthUser(req, res, next);
      const appId = req.params.applicationId;
      const data = await applicationServiceInstance.unapproveApplication(appId, user);

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public submitApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getAuthUser(req, res, next);
      const appId = req.params.applicationId;
      const data = await applicationServiceInstance.submitApplication(appId, user);

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a manifest for a single application by id.
   *
   * @param req
   * @param res
   * @param next
   */
  public getReleaseManifest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const applicationId = req.params.applicationId;

      const application = await applicationServiceInstance.asApplication(applicationId);

      // TBD: check the permissions of the application
      // if the application is not approved then return Not found as the manifest does not yet exist
      if (application === null || application.state != 'approved') {
        res.sendStatus(404);
      } else {
        const manifest: ReleaseManifestApiModel = {
          id: applicationId,
          htsgetUrl: 'https://htsget.dev.umccr.org',
          htsgetArtifacts: {},
        };

        for (const a of await applicationServiceInstance.getApplicationReleaseArtifacts(applicationId)) {
          const rule: ReleaseManifestArtifactApiModel = {
            sampleId: a.sampleId,
          };

          if (a.chromosomes && a.chromosomes.length > 0) {
            // for the moment we make each chromosome into a different region rule
            // (only supports chromosome level rules TBD gene rules)
            rule.restrictToRegions = a.chromosomes.map(c => {
              return {
                chromosome: c,
              };
            });
          }

          manifest.htsgetArtifacts[a.path] = rule;
        }

        res.status(200).json(manifest);
      }
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
      const user = getAuthUser(req, res, next);
      const data = await applicationServiceInstance.listByUserAsResearcher(user);

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public listApplicationsAsCommittee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getAuthUser(req, res, next);
      const data = await applicationServiceInstance.listByUserAsCommittee(user);

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };
}
