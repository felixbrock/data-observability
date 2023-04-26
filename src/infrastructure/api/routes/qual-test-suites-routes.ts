import { Router } from 'express';
import app from '../../ioc-register';
import ReadQualTestSuitesController from '../controllers/read-qual-test-suites-controller';
import UpdateQualTestSuitesController from '../controllers/update-qual-test-suites-controller';
import CreateQualTestSuitesController from '../controllers/create-qual-test-suites-controller';
import DeleteQualTestSuitesController from '../controllers/delete-qual-test-suites-controller';

const qualTestSuitesRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const getSnowflakeProfile = app.resolve('getSnowflakeProfile');
const dbo = app.resolve('dbo');

const readQualTestSuitesController = new ReadQualTestSuitesController(
  app.resolve('readQualTestSuites'),
  getAccounts,
  getSnowflakeProfile,
  dbo
);

const createQualTestSuitesController = new CreateQualTestSuitesController(
  app.resolve('createQualTestSuites'),
  getAccounts,
  getSnowflakeProfile,
  dbo
);

const updateQualTestSuitesController = new UpdateQualTestSuitesController(
  app.resolve('updateQualTestSuites'),
  getAccounts,
  getSnowflakeProfile,
  dbo
);

const deleteQualTestSuitesController = new DeleteQualTestSuitesController(
  app.resolve('deleteQualTestSuites'),
  getAccounts,
  getSnowflakeProfile,
  dbo
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

qualTestSuitesRoutes.delete('/', (req, res) => {
  deleteQualTestSuitesController.execute(req, res);
});

export default qualTestSuitesRoutes;
