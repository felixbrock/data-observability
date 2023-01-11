import { Router } from 'express';
import app from '../../ioc-register';
import HandleQualTestExecutionResultController from '../controllers/handle-qual-test-execution-result-controller';
import ReadQualTestSuiteController from '../controllers/read-qual-test-suite-controller';
import TriggerQualTestSuiteExecutionController from '../controllers/trigger-qual-test-suite-execution-controller';

const qualTestSuiteRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const getSnowflakeProfile = app.resolve('getSnowflakeProfile');
const dbo = app.resolve('dbo');

const readQualTestSuiteController = new ReadQualTestSuiteController(
  app.resolve('readQualTestSuite'),
  getAccounts,
  getSnowflakeProfile
);

const triggerQualTestSuiteExecutionController =
  new TriggerQualTestSuiteExecutionController(
    app.resolve('triggerQualTestSuiteExecution'),
    getAccounts,
    getSnowflakeProfile,
    dbo
  );

const handleQualTestExecutionResultController =
  new HandleQualTestExecutionResultController(
    app.resolve('handleQualTestExecutionResult'),
    getAccounts,
    getSnowflakeProfile,
    dbo
  );

qualTestSuiteRoutes.get('/:id', (req, res) => {
  readQualTestSuiteController.execute(req, res);
});

qualTestSuiteRoutes.post('/:id/execute', (req, res) => {
  triggerQualTestSuiteExecutionController.execute(req, res);
});

qualTestSuiteRoutes.post('/:id/result', (req, res) => {
  handleQualTestExecutionResultController.execute(req, res);
});

export default qualTestSuiteRoutes;
