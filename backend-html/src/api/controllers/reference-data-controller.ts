import { NextFunction, Request, Response } from 'express';
import { PanelAppDynamoClient } from '../../panelapp/panel-app-dynamo-client';
import { PanelappPanelApiModel } from '../../../../shared-src/api-models/panelapp-panel';

export class ReferenceDataController {
  /**
   * Get list of panels in panel app.
   *
   * @param req
   * @param res
   * @param next
   */
  public listAllPanels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = new PanelAppDynamoClient();

      const all = await client.panelList();

      res.status(200).json(all);
    } catch (error) {
      next(error);
    }
  };

  public listGenesForPanel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const panelId = parseInt(req.params.panelId);

      const client = new PanelAppDynamoClient();

      // TBD - we need to make an efficient get() operation using indexes.. const panel = await client.panelGet(panelId);
      const all = await client.panelGenes(panelId);

      const result: PanelappPanelApiModel = {
        id: panelId.toString(),
        name: 'TBD',
        version: 'TBD',
        genes: all,
      };

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
