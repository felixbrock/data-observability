import { Router } from 'express';
import app from '../../ioc-register';
import ReadQualTestSuitesController from '../controllers/read-qualitative-test-suites-controller';
import UpdateQualTestSuitesController from '../controllers/update-qualitative-test-suites-controller';
import CreateQualTestSuitesController from '../controllers/create-qualitative-test-suites-controller';

const qualTestSuitesRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const getSnowflakeProfile = app.resolve('getSnowflakeProfile');

const readQualTestSuitesController = new ReadQualTestSuitesController(
  app.resolve('readQualTestSuites'),
  getAccounts,
  getSnowflakeProfile
);

const createQualTestSuitesController = new CreateQualTestSuitesController(
  app.resolve('createQualTestSuites'),
  getAccounts,
  getSnowflakeProfile
);

const updateQualTestSuitesController = new UpdateQualTestSuitesController(
  app.resolve('updateQualTestSuites'),
  getAccounts,
  getSnowflakeProfile
);

qualTestSuitesRoutes.get('/', (req, res) => {
  readQualTestSuitesController.execute(req, res);
});

qualTestSuitesRoutes.post('/', (req, res) => {
  createQualTestSuitesController.execute(req, res);
});

qualTestSuitesRoutes.patch('/', (req, res) => {
  updateQualTestSuitesController.execute(req, res);
});

export default qualTestSuitesRoutes;
