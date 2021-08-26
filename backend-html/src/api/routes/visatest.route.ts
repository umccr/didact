import { Router } from 'express';
import { IRoute } from './_routes.interface';
import { VisaController } from '../controllers/visa-controller';

export class VisaTestRoute implements IRoute {
  public path = '/visatest';
  public router = Router();
  public visaController = new VisaController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.visaController.getTest);
  }
}
