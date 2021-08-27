import { NextFunction, Request, Response } from 'express';
import { datasetServiceInstance } from '../../business/services/dataset.service';

export class DatasetController {
  /**
   * Get all datasets.
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

  /**
   * Get a single dataset by id.
   *
   * @param req
   * @param res
   * @param next
   */
  public getDataset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // we have a slight complication that because dataset ids can be externally defined - they may include
      // slash characters - so see the corresponding route - but we use regex match groups to capture
      // the whole of this id
      const dsId = req.params[0];

      const data = await datasetServiceInstance.asDataset(dsId);

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };
}
