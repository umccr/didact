import { Router } from 'express';
import { IRoute } from './_routes.interface';
import { DatasetController } from '../controllers/dataset-controller';

export class DatasetRoute implements IRoute {
  public path = '/dataset';
  public router = Router();
  public datasetController = new DatasetController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.datasetController.listAllDatasets);
  }
}
