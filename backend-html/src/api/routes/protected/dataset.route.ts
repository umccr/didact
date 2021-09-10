import { Router } from 'express';
import { IRoute } from '../_routes.interface';
import { DatasetController } from '../../controllers/dataset-controller';
import jwt from 'express-jwt';
import { createJwtMiddleware } from '../_routes.utils';

export class DatasetRoute implements IRoute {
  public path = '/dataset';
  public router = Router();

  private readonly datasetController = new DatasetController();
  private readonly jwtMiddleware: jwt.RequestHandler;

  constructor(callback: jwt.SecretCallbackLong) {
    this.jwtMiddleware = createJwtMiddleware(callback);

    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.jwtMiddleware, this.datasetController.listAllDatasets);
    this.router.get(/^\/dataset\/(.+)/, this.jwtMiddleware, this.datasetController.getDataset);
  }
}
