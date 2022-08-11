import { Router } from 'express';
import app from '../../ioc-register';
import CreateTestSuiteController from '../controllers/create-test-suite-controller';
import ReadTestSuiteController from '../controllers/read-test-suite-controller';
import UpdateTestHistoryEntryController from '../controllers/update-test-history-enty-controller';
import UpdateTestSuiteController from '../controllers/update-test-suite-controller';

const testSuiteRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const readTestSuiteController = new ReadTestSuiteController(
  app.resolve('readTestSuite'),
  getAccounts,
);

const createTestSuiteController = new CreateTestSuiteController(
  app.resolve('createTestSuite'),
  getAccounts,
  dbo
);

const updateTestSuiteController = new UpdateTestSuiteController(
  app.resolve('updateTestSuite'),
  getAccounts
);

const updateTestHistoryEntryController = new UpdateTestHistoryEntryController(
  app.resolve('updateTestHistoryEntry'),
  getAccounts
);

testSuiteRoutes.get('/:testSuiteId', (req, res) => {
  readTestSuiteController.execute(req, res);
});

testSuiteRoutes.post('/', (req, res) => {
  createTestSuiteController.execute(req, res);
});

testSuiteRoutes.patch('/:testSuiteId', (req, res) => {
  updateTestSuiteController.execute(req, res);
});

testSuiteRoutes.patch('/history/:alertId', (req, res) => {
  updateTestHistoryEntryController.execute(req, res);
});

export default testSuiteRoutes;
