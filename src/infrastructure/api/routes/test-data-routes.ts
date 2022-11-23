import { Router } from 'express';
import app from '../../ioc-register';
import UpdateTestHistoryEntryController from '../controllers/update-test-history-entry-controller';

const testDataRoutes = Router();

const getAccounts = app.resolve('getAccounts');

const updateTestHistoryEntryController = new UpdateTestHistoryEntryController(
  app.resolve('updateTestHistoryEntry'),
  getAccounts,
  app.resolve('getSnowflakeProfile')
);

testDataRoutes.patch('/history/:alertId', (req, res) => {
  updateTestHistoryEntryController.execute(req, res);
});

export default testDataRoutes;
