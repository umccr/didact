import { Router } from 'express';
import { IRoute } from '../_routes.interface';
import { VisaController } from '../../controllers/visa-controller';

export class VisaRoute implements IRoute {
  public path = '/visa';
  public router = Router();
  public visaController = new VisaController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.visaController.getForUser);
  }
}
