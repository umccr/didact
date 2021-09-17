import { NextFunction, Request, Response } from 'express';
import { userServiceInstance } from '../../business/services/user.service';

export class UserController {
  /**
   * Get all datasets.
   *
   * @param req
   * @param res
   * @param next
   */
  public listAllResearchers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await userServiceInstance.listResearchers();

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };
}
