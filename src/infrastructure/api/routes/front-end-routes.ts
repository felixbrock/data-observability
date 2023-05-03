import { Router } from 'express';
import app from '../../ioc-register';
import ReadTestHistoryController from '../controllers/read-test-history-controller';
import ReadSelectedTestSuiteController from '../controllers/read-selected-test-suite-controller';
import ReadTestAlertsController from '../controllers/read-test-alerts-controller';

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

const readSelectedTestSuiteController = new ReadSelectedTestSuiteController(
    app.resolve('readTestSuite'),
    getAccounts,
    getSnowflakeProfile,
    dbo
);

const readTestAlertsController = new ReadTestAlertsController(
    app.resolve('readTestAlerts'),
    getAccounts,
    getSnowflakeProfile,
    dbo
);

frontEndRoutes.get('/history', (req, res) => {
    readTestHistoryController.execute(req, res);
});

frontEndRoutes.get('/selected', (req, res) => {
    readSelectedTestSuiteController.execute(req, res);
});

frontEndRoutes.get('/alerts', (req, res) => {
    readTestAlertsController.execute(req, res);
});

export default frontEndRoutes;