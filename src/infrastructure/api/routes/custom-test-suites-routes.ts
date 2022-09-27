import { Router } from 'express';
import app from '../../ioc-register';
import ReadCustomTestSuitesController from '../controllers/read-test-suites-controller';
import TriggerCustomTestSuitesExecutionController from '../controllers/trigger-custom-test-suites-execution-controller';

const customTestSuitesRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const readCustomTestSuitesController = new ReadCustomTestSuitesController(
  app.resolve('readCustomTestSuites'),
  app.resolve('getAccounts')
);

const triggerCustomTestSuitesExecutionController =
  new TriggerCustomTestSuitesExecutionController(
    app.resolve('triggerTestSuitesExecution'),
    getAccounts,
    dbo
  );

customTestSuitesRoutes.get('/', (req, res) => {
  readCustomTestSuitesController.execute(req, res);
});

customTestSuitesRoutes.post('/execute', (req, res) => {
  triggerCustomTestSuitesExecutionController.execute(req, res);
});

export default customTestSuitesRoutes;
