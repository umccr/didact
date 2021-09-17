import { RequestHandler, Router } from "express";
import { IRoute } from '../_routes.interface';
import jwt from 'express-jwt';
import { createJwtMiddleware } from '../_routes.utils';
import { UserController } from '../../controllers/user-controller';

export class UserRoute implements IRoute {
  public path = '/user';
  public router = Router();

  private readonly userController = new UserController();
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
    this.router.get(`${this.path}/researcher`, this.jwtMiddleware, this.userController.listAllResearchers);
  }
}
