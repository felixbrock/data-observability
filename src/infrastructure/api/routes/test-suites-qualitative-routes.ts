import { Router } from 'express';
import app from '../../ioc-register';
import ReadQualitativeTestSuitesController from '../controllers/read-qualitative-test-suites-controller';
import UpdateQualitativeTestSuitesController from '../controllers/update-qualitative-test-suites-controller';
import CreateQualitativeTestSuitesController from '../controllers/create-qualitative-test-suites-controller';

const qualitativeTestSuitesRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const getSnowflakeProfile = app.resolve('getSnowflakeProfile');

const readQualitativeTestSuitesController = new ReadQualitativeTestSuitesController(
  app.resolve('readQualitativeTestSuites'),
  getAccounts,
  getSnowflakeProfile
);

const createQualitativeTestSuitesController = new CreateQualitativeTestSuitesController(
  app.resolve('createQualitativeTestSuites'),
  getAccounts,
  getSnowflakeProfile
);

const updateQualitativeTestSuitesController = new UpdateQualitativeTestSuitesController(
  app.resolve('updateQualitativeTestSuites'),
  getAccounts,
  getSnowflakeProfile
);

qualitativeTestSuitesRoutes.get('/', (req, res) => {
  readQualitativeTestSuitesController.execute(req, res);
});

qualitativeTestSuitesRoutes.post('/', (req, res) => {
  createQualitativeTestSuitesController.execute(req, res);
});

qualitativeTestSuitesRoutes.patch('/', (req, res) => {
  updateQualitativeTestSuitesController.execute(req, res);
});

export default qualitativeTestSuitesRoutes;
