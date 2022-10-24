import { Router } from 'express';
import app from '../../ioc-register';
import ReadNominalTestSuiteController from '../controllers/read-nominal-test-suite-controller';
import TriggerNominalTestSuiteExecutionController from '../controllers/trigger-nominal-test-suite-execution-controller';

const nominalTestSuiteRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const readNominalTestSuiteController = new ReadNominalTestSuiteController(
  app.resolve('readNominalTestSuite'),
  getAccounts,
);

const triggerNominalTestSuiteExecutionController = new TriggerNominalTestSuiteExecutionController(
  app.resolve('triggerNominalTestSuiteExecution'),
  getAccounts,
  dbo
);

nominalTestSuiteRoutes.get('/:id', (req, res) => {
  readNominalTestSuiteController.execute(req, res);
});

nominalTestSuiteRoutes.post('/:id/execute', (req, res) => {
  triggerNominalTestSuiteExecutionController.execute(req, res);
});

export default nominalTestSuiteRoutes;
