import { Router } from 'express';
import app from '../../ioc-register';
import ReadQualitativeTestSuiteController from '../controllers/read-qualitative-test-suite-controller';
import TriggerQualitativeTestSuiteExecutionController from '../controllers/trigger-qualitative-test-suite-execution-controller';

const qualitativeTestSuiteRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const getSnowflakeProfile = app.resolve('getSnowflakeProfile');
const dbo = app.resolve('dbo');

const readQualitativeTestSuiteController = new ReadQualitativeTestSuiteController(
  app.resolve('readQualitativeTestSuite'),
  getAccounts,
  getSnowflakeProfile
);

const triggerQualitativeTestSuiteExecutionController = new TriggerQualitativeTestSuiteExecutionController(
  app.resolve('triggerQualitativeTestSuiteExecution'),
  getAccounts,
  getSnowflakeProfile,
  dbo
);

qualitativeTestSuiteRoutes.get('/:id', (req, res) => {
  readQualitativeTestSuiteController.execute(req, res);
});

qualitativeTestSuiteRoutes.post('/:id/execute', (req, res) => {
  triggerQualitativeTestSuiteExecutionController.execute(req, res);
});

export default qualitativeTestSuiteRoutes;
