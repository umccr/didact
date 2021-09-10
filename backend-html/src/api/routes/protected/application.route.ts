import { Router } from 'express';
import { IRoute } from '../_routes.interface';
import { ApplicationController } from '../../controllers/application-controller';
import jwt from 'express-jwt';
import { createJwtMiddleware } from '../_routes.utils';

export class ApplicationRoute implements IRoute {
  public readonly path = '/application';
  public readonly router = Router();

  private readonly applicationController = new ApplicationController();
  private readonly jwtMiddleware: jwt.RequestHandler;

  constructor(callback: jwt.SecretCallbackLong) {
    this.jwtMiddleware = createJwtMiddleware(callback);

    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, this.jwtMiddleware, this.applicationController.newApplication);
    this.router.get(`${this.path}-r`, this.jwtMiddleware, this.applicationController.listApplicationsAsResearcher);
    this.router.get(`${this.path}-c`, this.jwtMiddleware, this.applicationController.listApplicationsAsCommittee);
    this.router.get(`${this.path}/:applicationId`, this.jwtMiddleware, this.applicationController.getApplication);

    // a mini state machine for changing the application
    this.router.post(`${this.path}/:applicationId/approve`, this.jwtMiddleware, this.applicationController.approveApplication);
    this.router.post(`${this.path}/:applicationId/unapprove`, this.jwtMiddleware, this.applicationController.unapproveApplication);
    this.router.post(`${this.path}/:applicationId/submit`, this.jwtMiddleware, this.applicationController.submitApplication);
  }
}
