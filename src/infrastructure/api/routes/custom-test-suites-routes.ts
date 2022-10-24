import { Router } from 'express';
import app from '../../ioc-register';
import ReadCustomTestSuitesController from '../controllers/read-custom-test-suites-controller';

const customTestSuitesRoutes = Router();

const readCustomTestSuitesController = new ReadCustomTestSuitesController(
  app.resolve('readCustomTestSuites'),
  app.resolve('getAccounts')
);

customTestSuitesRoutes.get('/', (req, res) => {
  readCustomTestSuitesController.execute(req, res);
});

export default customTestSuitesRoutes;
