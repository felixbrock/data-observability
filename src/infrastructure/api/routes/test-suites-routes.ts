import { Router } from 'express';
import app from '../../ioc-register';
import ReadTestSuitesController from '../controllers/read-test-suites-controller';
import UpdateTestSuitesController from '../controllers/update-test-suites-controller';
import CreateTestSuitesController from '../controllers/create-test-suites-controller';
import DeleteTestSuitesController from '../controllers/delete-test-suites-controller';
import DeleteTestSuiteDuplicatesController from '../controllers/delete-test-suite-duplicates-controller';

const testSuitesRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const getSnowflakeProfile = app.resolve('getSnowflakeProfile');
const dbo = app.resolve('dbo');

const readTestSuitesController = new ReadTestSuitesController(
  app.resolve('readTestSuites'),
  getAccounts,
  getSnowflakeProfile,
  dbo
);

const createTestSuitesController = new CreateTestSuitesController(
  app.resolve('createTestSuites'),
  getAccounts,
  getSnowflakeProfile,
  dbo
);

const updateTestSuitesController = new UpdateTestSuitesController(
  app.resolve('updateTestSuites'),
  getAccounts,
  getSnowflakeProfile,
  dbo
);

const deleteTestSuitesController = new DeleteTestSuitesController(
  app.resolve('deleteTestSuites'),
  getAccounts,
  getSnowflakeProfile,
  dbo
);
const deleteTestSuiteDuplicatesController =
  new DeleteTestSuiteDuplicatesController(
    app.resolve('deleteTestSuiteDuplicates'),
    getAccounts,
    getSnowflakeProfile,
    dbo
  );

testSuitesRoutes.get('/', (req, res) => {
  readTestSuitesController.execute(req, res);
});

testSuitesRoutes.post('/', (req, res) => {
  createTestSuitesController.execute(req, res);
});

testSuitesRoutes.patch('/', (req, res) => {
  updateTestSuitesController.execute(req, res);
});

testSuitesRoutes.delete('/', (req, res) => {
  deleteTestSuitesController.execute(req, res);
});

testSuitesRoutes.delete('/duplicates', (req, res) => {
  deleteTestSuiteDuplicatesController.execute(req, res);
});

export default testSuitesRoutes;
