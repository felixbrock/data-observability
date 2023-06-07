import { Router } from 'express';
import app from '../../ioc-register';
import CreateCustomTestSuiteController from '../controllers/create-custom-test-suite-controller';
import DeleteCustomTestSuitesController from '../controllers/delete-custom-test-suites-controller';
import DeleteCustomTestSuiteController from '../controllers/delete-custom-test-suite-controller';
import ReadCustomTestSuiteController from '../controllers/read-custom-test-suite-controller';
import TriggerCustomTestSuiteExecutionController from '../controllers/trigger-custom-test-suite-execution-controller';
import UpdateCustomTestSuiteController from '../controllers/update-custom-test-suite-controller';

const customTestSuiteRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const getSnowflakeProfile = app.resolve('getSnowflakeProfile');
const dbo = app.resolve('dbo');

const readCustomTestSuiteController = new ReadCustomTestSuiteController(
  app.resolve('readCustomTestSuite'),
  getAccounts,
  getSnowflakeProfile,
  dbo
);

const createCustomTestSuiteController = new CreateCustomTestSuiteController(
  app.resolve('createCustomTestSuite'),
  getAccounts,
  getSnowflakeProfile,
  dbo
);

const updateCustomTestSuiteController = new UpdateCustomTestSuiteController(
  app.resolve('updateCustomTestSuite'),
  getAccounts,
  getSnowflakeProfile,
  dbo
);

const triggerCustomTestSuiteExecutionController =
  new TriggerCustomTestSuiteExecutionController(
    app.resolve('triggerCustomTestSuiteExecution'),
    getAccounts,
    getSnowflakeProfile,
    dbo
  );

const deleteCustomTestSuiteController = new DeleteCustomTestSuiteController(
    app.resolve('deleteCustomTestSuite'),
    getAccounts,
    getSnowflakeProfile,
    dbo
  );

const deleteCustomTestSuitesController = new DeleteCustomTestSuitesController(
  app.resolve('deleteCustomTestSuites'),
  getAccounts,
  getSnowflakeProfile,
  dbo
);

customTestSuiteRoutes.get('/:id', (req, res) => {
  readCustomTestSuiteController.execute(req, res);
});

customTestSuiteRoutes.post('/', (req, res) => {
  createCustomTestSuiteController.execute(req, res);
});

customTestSuiteRoutes.patch('/:id', (req, res) => {
  updateCustomTestSuiteController.execute(req, res);
});

customTestSuiteRoutes.post('/:id/execute', (req, res) => {
  triggerCustomTestSuiteExecutionController.execute(req, res);
});

customTestSuiteRoutes.delete('/:id', (req, res) => {
  deleteCustomTestSuiteController.execute(req, res);
});

customTestSuiteRoutes.delete('/', (req, res) => {
  deleteCustomTestSuitesController.execute(req, res);
});

export default customTestSuiteRoutes;
