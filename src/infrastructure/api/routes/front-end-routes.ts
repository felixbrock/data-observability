import { Router } from 'express';
import app from '../../ioc-register';
import ReadTestHistoryController from '../controllers/read-test-history-controller';
import ReadLineageTestSuitesController from '../controllers/read-lineage-test-suites-controller';
import ReadAlertHistoryController from '../controllers/read-alert-history-controller';

const frontEndRoutes = Router();

const getAccounts = app.resolve('getAccounts');
const getSnowflakeProfile = app.resolve('getSnowflakeProfile');
const dbo = app.resolve('dbo');

const readTestHistoryController = new ReadTestHistoryController(
  app.resolve('readTestHistory'),
  getAccounts,
  getSnowflakeProfile,
  dbo
);

const readLineageTestSuitesController = new ReadLineageTestSuitesController(
    app.resolve('readTestSuite'),
    getAccounts,
    getSnowflakeProfile,
    dbo
);

const readTestAlertsController = new ReadAlertHistoryController(
    app.resolve('readAlertHistory'),
    getAccounts,
    getSnowflakeProfile,
    dbo
);

frontEndRoutes.get('/history', (req, res) => {
    readTestHistoryController.execute(req, res);
});

frontEndRoutes.get('/selected', (req, res) => {
    readLineageTestSuitesController.execute(req, res);
});

frontEndRoutes.get('/alerts', (req, res) => {
    readTestAlertsController.execute(req, res);
});

export default frontEndRoutes;