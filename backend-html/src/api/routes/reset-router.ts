import { Router } from 'express';
import { setupTestData } from '../../testing/setup-test-data';

/**
 * NOTE: this is just so we can have a stable demo - this would obviously
 * not be a real app
 */

export const resetRouter = Router();

resetRouter.post('/reset', async (req, res, next) => {
  await setupTestData(true);

  res.status(200).json({});
});
