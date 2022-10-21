import { Router } from 'express';
import app from '../../ioc-register';
import ReadNominalTestSuiteController from '../controllers/read-nominal-test-suite-controller';
import TriggerNominalTestSuiteExecutionController from '../controllers/trigger-nominal-test-suite-execution-controller';
import UpdateTestHistoryEntryController from '../controllers/update-test-history-entry-controller';

const nominalTestSuiteRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const readNominalTestSuiteController = new ReadNominalTestSuiteController(
  app.resolve('readNominalTestSuite'),
  getAccounts,
);

const updateTestHistoryEntryController = new UpdateTestHistoryEntryController(
  app.resolve('updateTestHistoryEntry'),
  getAccounts
);

const triggerNominalTestSuiteExecutionController = new TriggerNominalTestSuiteExecutionController(
  app.resolve('triggerNominalTestSuiteExecution'),
  getAccounts,
  dbo
);

nominalTestSuiteRoutes.get('/:testSuiteId', (req, res) => {
  readNominalTestSuiteController.execute(req, res);
});

nominalTestSuiteRoutes.patch('/history/:alertId', (req, res) => {
  updateTestHistoryEntryController.execute(req, res);
});

nominalTestSuiteRoutes.post('/execute', (req, res) => {
  triggerNominalTestSuiteExecutionController.execute(req, res);
});

export default nominalTestSuiteRoutes;
