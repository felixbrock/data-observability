import { Router } from 'express';
import app from '../../ioc-register';
import HandleQuantTestExecutionResultController from '../controllers/handle-quant-test-execution-result-controller';
import ReadTestSuiteController from '../controllers/read-test-suite-controller';
import TriggerTestSuiteExecutionController from '../controllers/trigger-test-suite-execution-controller';

const testSuiteRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const getSnowflakeProfile = app.resolve('getSnowflakeProfile');
const dbo = app.resolve('dbo');

const readTestSuiteController = new ReadTestSuiteController(
  app.resolve('readTestSuite'),
  getAccounts,
  getSnowflakeProfile
);

const triggerTestSuiteExecutionController =
  new TriggerTestSuiteExecutionController(
    app.resolve('triggerTestSuiteExecution'),
    getAccounts,
    getSnowflakeProfile,
    dbo
  );

const handleQuantTestExecutionResultController =
  new HandleQuantTestExecutionResultController(
    app.resolve('handleQuantTestExecutionResult'),
    getAccounts,
    getSnowflakeProfile,
    dbo
  );

testSuiteRoutes.get('/:id', (req, res) => {
  readTestSuiteController.execute(req, res);
});

testSuiteRoutes.post('/:id/execute', (req, res) => {
  triggerTestSuiteExecutionController.execute(req, res);
});

testSuiteRoutes.post('/execution/result/handle', (req, res) => {
  handleQuantTestExecutionResultController.execute(req, res);
});

export default testSuiteRoutes;
