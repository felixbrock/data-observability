import { Router } from 'express';
import app from '../../ioc-register';
import ReadNominalTestSuitesController from '../controllers/read-test-suites-controller';
import UpdateNominalTestSuitesController from '../controllers/update-test-suites-controller';
import CreateNominalTestSuitesController from '../controllers/create-test-suites-controller';
import TriggerNominalTestSuitesExecutionController from '../controllers/trigger-nominal-test-suites-execution-controller';

const nominalTestSuitesRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const dbo = app.resolve('dbo');

const readNominalTestSuitesController = new ReadNominalTestSuitesController(
  app.resolve('readNominalTestSuites'),
  getAccounts
);

const createNominalTestSuitesController = new CreateNominalTestSuitesController(
  app.resolve('createNominalTestSuites'),
  getAccounts
);

const updateNominalTestSuitesController = new UpdateNominalTestSuitesController(
  app.resolve('updateNominalTestSuites'),
  getAccounts
);

const triggerNominalTestSuitesExecutionController =
  new TriggerNominalTestSuitesExecutionController(
    app.resolve('triggerTestSuitesExecution'),
    getAccounts,
    dbo
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

nominalTestSuitesRoutes.post('/execute', (req, res) => {
  triggerNominalTestSuitesExecutionController.execute(req, res);
});

export default nominalTestSuitesRoutes;
