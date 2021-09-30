import { RequestHandler, Router } from 'express';
import { IRoute } from '../_routes.interface';
import jwt from 'express-jwt';
import { createJwtMiddleware } from '../_routes.utils';
import { ReferenceDataController } from '../../controllers/reference-data-controller';

export class ReferenceDataRoute implements IRoute {
  public path = '/reference-data';
  public router = Router();

  private readonly rdController = new ReferenceDataController();
  private readonly jwtMiddleware: RequestHandler;

  constructor(callback: jwt.SecretCallbackLong | null) {
    this.jwtMiddleware = callback
      ? createJwtMiddleware(callback)
      : (req, res, next) => {
          next();
        };

    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/panels`, this.jwtMiddleware, this.rdController.listAllPanels);
    this.router.get(`${this.path}/panels/:panelId`, this.jwtMiddleware, this.rdController.listGenesForPanel);
  }
}
