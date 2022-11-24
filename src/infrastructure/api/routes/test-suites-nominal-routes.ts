import { Router } from 'express';
import app from '../../ioc-register';
import ReadNominalTestSuitesController from '../controllers/read-nominal-test-suites-controller';
import UpdateNominalTestSuitesController from '../controllers/update-nominal-test-suites-controller';
import CreateNominalTestSuitesController from '../controllers/create-nominal-test-suites-controller';

const nominalTestSuitesRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const getSnowflakeProfile = app.resolve('getSnowflakeProfile');

const readNominalTestSuitesController = new ReadNominalTestSuitesController(
  app.resolve('readNominalTestSuites'),
  getAccounts,
  getSnowflakeProfile
);

const createNominalTestSuitesController = new CreateNominalTestSuitesController(
  app.resolve('createNominalTestSuites'),
  getAccounts,
  getSnowflakeProfile
);

const updateNominalTestSuitesController = new UpdateNominalTestSuitesController(
  app.resolve('updateNominalTestSuites'),
  getAccounts,
  getSnowflakeProfile
);

nominalTestSuitesRoutes.get('/', (req, res) => {
  readNominalTestSuitesController.execute(req, res);
});

nominalTestSuitesRoutes.post('/', (req, res) => {
  createNominalTestSuitesController.execute(req, res);
});

nominalTestSuitesRoutes.patch('/', (req, res) => {
  updateNominalTestSuitesController.execute(req, res);
});

export default nominalTestSuitesRoutes;
