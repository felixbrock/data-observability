import { Router } from 'express';
import app from '../../ioc-register';
import CreateCustomTestSuiteController from '../controllers/create-custom-test-suite-controller';
import ReadCustomTestSuiteController from '../controllers/read-custom-test-suite-controller';
import TriggerCustomTestSuiteExecutionController from '../controllers/trigger-custom-test-suite-execution-controller';
import UpdateCustomTestSuiteController from '../controllers/update-custom-test-suite-controller';

const customTestSuiteRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const readCustomTestSuiteController = new ReadCustomTestSuiteController(
  app.resolve('readCustomTestSuite'),
  getAccounts,
);

const createCustomTestSuiteController = new CreateCustomTestSuiteController(
  app.resolve('createCustomTestSuite'),
  getAccounts,
  dbo
);

const updateCustomTestSuiteController = new UpdateCustomTestSuiteController(
  app.resolve('updateCustomTestSuite'),
  getAccounts
);

const triggerCustomTestSuiteExecutionController = new TriggerCustomTestSuiteExecutionController(
  app.resolve('triggerCustomTestSuiteExecution'),
  getAccounts,
  dbo
);

customTestSuiteRoutes.get('/:customTestSuiteId', (req, res) => {
  readCustomTestSuiteController.execute(req, res);
});

customTestSuiteRoutes.post('/', (req, res) => {
  createCustomTestSuiteController.execute(req, res);
});

customTestSuiteRoutes.patch('/:customTestSuiteId', (req, res) => {
  updateCustomTestSuiteController.execute(req, res);
});

customTestSuiteRoutes.post('/execute', (req, res) => {
  triggerCustomTestSuiteExecutionController.execute(req, res);
});

export default customTestSuiteRoutes;
