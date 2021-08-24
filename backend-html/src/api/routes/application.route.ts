import { Router } from 'express';
import { IRoute } from './_routes.interface';
import { ApplicationController } from '../controllers/application-controller';

export class ApplicationRoute implements IRoute {
  public path = '/application';
  public router = Router();
  public applicationController = new ApplicationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, this.applicationController.newApplication);
    this.router.get(`${this.path}/:applicationId`, this.applicationController.getApplication);
    this.router.get(`${this.path}-r`, this.applicationController.listApplicationsAsResearcher);
    this.router.get(`${this.path}-c`, this.applicationController.listApplicationsAsCommittee);
  }
}
