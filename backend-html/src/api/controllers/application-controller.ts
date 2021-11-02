import { NextFunction, Request, Response } from 'express';
import { applicationServiceInstance } from '../../business/services/application/application.service';
import { ApplicationApiEditableModel, ApplicationApiModel } from '../../../../shared-src/api-models/application';
import { ReleaseManifestApiModel, ReleaseManifestArtifactsApiModel } from '../../../../shared-src/api-models/release';
import { getAuthUser } from './_controller.utils';
import { PanelAppDynamoClient } from '../../panelapp/panel-app-dynamo-client';
import { PanelappPanelApiModel } from '../../../../shared-src/api-models/panelapp-panel';

const allChromosomes = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  'X',
  'Y',
  'MT',
];
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

      const data = await applicationServiceInstance.asApplication(appId, user);

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

  public updateApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getAuthUser(req, res, next);
      const appId = req.params.applicationId;
      const input: ApplicationApiEditableModel = req.body;

      const data = await applicationServiceInstance.update(appId, user, input);

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

      const application = await applicationServiceInstance.asApplication(applicationId, null);

      // TBD: check the permissions of the application (bearer token?)

      // if the application is not approved then return Not found as the manifest does not yet exist
      if (application === null || application.state != 'approved') {
        res.sendStatus(404);
      } else {
        // should never happen but it is a prototype so who knows
        if (!application.release) {
          throw new Error('Release was in an invalid state');
        }

        // our starting manifest - we will fill in the sections as we decide they are needed
        const manifest: ReleaseManifestApiModel = {
          id: applicationId,
          patientIds: [],
          htsgetUrl: undefined,
          htsgetArtifacts: undefined,
          htsgetRegions: undefined,
          fhirUrl: undefined,
          fhirPatients: undefined,
        };

        const releaseSubjects = await applicationServiceInstance.getApplicationReleaseSubjects(applicationId);

        // every subject that is talked about in the release goes in the master patient id array
        for (const releaseSubject of releaseSubjects) {
          manifest.patientIds.push(releaseSubject.subjectId);
        }

        // only fill in htsget if the release in some way enables access to variants or reads
        if (application.release.htsgetEndpoint && (application.release.readsEnabled || application.release.variantsEnabled)) {
          manifest.htsgetUrl = application.release.htsgetEndpoint;
          manifest.htsgetArtifacts = {};
          manifest.htsgetRegions = [];

          for (const releaseSubject of releaseSubjects) {
            const htsget: ReleaseManifestArtifactsApiModel = {
              samples: {},
            };

            for (const sampleId of releaseSubject.sampleIds) {
              htsget.samples[sampleId] = {};
              // TODO: the logic of how these paths are formed needs to be done
              if (application.release.variantsEnabled) htsget.samples[sampleId].variantsPath = `/variants/10g/https/${sampleId}`;
              if (application.release.readsEnabled) htsget.samples[sampleId].readsPath = `/reads/10g/https/${sampleId}`;
            }

            manifest.htsgetArtifacts[releaseSubject.subjectId] = htsget;
          }

          // if a panel has been chosen at the top level, then we want to insert all the allowed regions
          if (application.release.panelappId && application.release.panelappVersion && application.release.panelappMinConfidence) {
            const client = new PanelAppDynamoClient();

            // TBD - we need to make an efficient get() operation using indexes.. const panel = await client.panelGet(panelId);
            const all = await client.panelGenes(parseInt(application.release.panelappId));

            for (const geneRegion of all) {
              if (application.release.panelappMinConfidence <= geneRegion.confidence) {
                // TODO: match the region data used to the knowledge of the 37/38 of the underlying data
                // similar could be done for matching chromosome naming scheme (eg '1' v 'chr1')
                manifest.htsgetRegions.push({
                  chromosome: geneRegion.grch38Chr,
                  start: geneRegion.grch38Start,
                  end: geneRegion.grch38End,
                });
                // note: I don't think we should give any guarantee at the API level that this data is sorted, but for
                // ease of reading the manifest we do this very simple sort.. (overlapping regions would be a nightmare
                // to define the sort order of - so lets not)
                manifest.htsgetRegions.sort((a, b) => {
                  const chrCompare = a.chromosome.localeCompare(b.chromosome, 'en', { numeric: true });

                  if (chrCompare === 0) {
                    return a.start > b.start ? 1 : -1;
                  } else return chrCompare;
                });
              }
            }
          } else {
            // no panel app specified - but we want to add in the positive assertions that all chromosome regions are
            // allowed
            for (const chr of allChromosomes) {
              manifest.htsgetRegions.push({
                chromosome: chr,
              });
            }
          }
        }

        if (application.release.fhirEndpoint && application.release.phenotypesEnabled) {
          manifest.fhirUrl = application.release.fhirEndpoint;
          manifest.fhirPatients = {};

          for (const releaseSubject of releaseSubjects) {
            manifest.fhirPatients[releaseSubject.subjectId] = {};
          }
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
