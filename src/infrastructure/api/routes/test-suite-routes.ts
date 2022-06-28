import { Router } from 'express';
import app from '../../ioc-register';
import CreateTestSuiteController from '../controllers/create-test-suite-controller';

const testSuiteRoutes = Router();

const createTestSuiteController = new CreateTestSuiteController(
  app.resolve('createTestSuite'),
  app.resolve('getAccounts'),
  app.resolve('db')
);

testSuiteRoutes.post('/', (req, res) => {
  createTestSuiteController.execute(req, res);
});

export default testSuiteRoutes;
