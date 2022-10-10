import { Router } from 'express';
import app from '../../ioc-register';
import ReadTestSuitesController from '../controllers/read-test-suites-controller';
import UpdateTestSuitesController from '../controllers/update-test-suites-controller';
import CreateTestSuitesController from '../controllers/create-test-suites-controller';
import TriggerTestSuitesExecutionController from '../controllers/trigger-test-suites-execution-controller';

const testSuitesRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const readTestSuitesController = new ReadTestSuitesController(
  app.resolve('readTestSuites'),
  getAccounts
);

const createTestSuitesController = new CreateTestSuitesController(
  app.resolve('createTestSuites'),
  getAccounts
);

const updateTestSuitesController = new UpdateTestSuitesController(
  app.resolve('updateTestSuites'),
  getAccounts
);

const triggerTestSuitesExecutionController = new TriggerTestSuitesExecutionController(
  app.resolve('triggerTestSuitesExecution'),
  getAccounts,
  dbo
);

testSuitesRoutes.get('/', (req, res) => {
  readTestSuitesController.execute(req, res);
});

testSuitesRoutes.post('/', (req, res) => {
  createTestSuitesController.execute(req, res);
});

testSuitesRoutes.patch('/', (req, res) => {
  updateTestSuitesController.execute(req, res);
});

testSuitesRoutes.post('/execute', (req, res) => {
  triggerTestSuitesExecutionController.execute(req, res);
});

export default testSuitesRoutes;
