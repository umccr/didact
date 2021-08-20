import { NextFunction, Request, Response } from 'express';
import { datasetServiceInstance } from '../../business/services/dataset.service';

export class DatasetController {
  /**
   * API call to retrieve all the datasets available.
   *
   * @param req
   * @param res
   * @param next
   */
  public listAllDatasets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await datasetServiceInstance.list();

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };
}
