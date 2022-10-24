import { Router } from 'express';
import app from '../../ioc-register';
import ReadTestSuiteController from '../controllers/read-test-suite-controller';
import TriggerTestSuiteExecutionController from '../controllers/trigger-test-suite-execution-controller';

const testSuiteRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const readTestSuiteController = new ReadTestSuiteController(
  app.resolve('readTestSuite'),
  getAccounts
);

const triggerTestSuiteExecutionController =
  new TriggerTestSuiteExecutionController(
    app.resolve('triggerTestSuiteExecution'),
    getAccounts,
    dbo
  );

testSuiteRoutes.get('/:id', (req, res) => {
  readTestSuiteController.execute(req, res);
});

testSuiteRoutes.post('/:id/execute', (req, res) => {
  triggerTestSuiteExecutionController.execute(req, res);
});

export default testSuiteRoutes;
