import { Router } from 'express';
import app from '../../ioc-register';
import ReadTestSuiteController from '../controllers/read-test-suite-controller';
import TriggerTestSuiteExecutionController from '../controllers/trigger-test-suite-execution-controller';
import UpdateTestHistoryEntryController from '../controllers/update-test-history-entry-controller';

const testSuiteRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const readTestSuiteController = new ReadTestSuiteController(
  app.resolve('readTestSuite'),
  getAccounts
);

const updateTestHistoryEntryController = new UpdateTestHistoryEntryController(
  app.resolve('updateTestHistoryEntry'),
  getAccounts
);

const triggerTestSuiteExecutionController =
  new TriggerTestSuiteExecutionController(
    app.resolve('triggerTestSuiteExecution'),
    getAccounts,
    dbo
  );

testSuiteRoutes.get('/:testSuiteId', (req, res) => {
  readTestSuiteController.execute(req, res);
});

testSuiteRoutes.patch('/history/:alertId', (req, res) => {
  updateTestHistoryEntryController.execute(req, res);
});

testSuiteRoutes.post('/execute', (req, res) => {
  triggerTestSuiteExecutionController.execute(req, res);
});

export default testSuiteRoutes;
