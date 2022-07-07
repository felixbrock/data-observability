import { Router } from 'express';
import app from '../../ioc-register';
import ReadTestSuitesController from '../controllers/read-test-suites-controller';

const testSuitesRoutes = Router();

const readTestSuitesController = new ReadTestSuitesController(
  app.resolve('readTestSuites'),
  app.resolve('getAccounts'),
  app.resolve('dbo')
);

testSuitesRoutes.get('/', (req, res) => {
  readTestSuitesController.execute(req, res);
});

export default testSuitesRoutes;