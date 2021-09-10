import { Router } from 'express';
import { IRoute } from '../_routes.interface';
import { ApplicationController } from '../../controllers/application-controller';

export class ManifestRoute implements IRoute {
  public path = '/manifest';
  public router = Router();
  public applicationController = new ApplicationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:applicationId`, this.applicationController.getReleaseManifest);
  }
}
