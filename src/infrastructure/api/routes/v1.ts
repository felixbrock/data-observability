import {Router } from 'express';
import { appConfig } from '../../../config';
import customTestSuiteRoutes from './custom-test-suite-routes';
import customTestSuitesRoutes from './custom-test-suites-routes';
import testDataRoutes from './test-data-routes';
import qualTestSuiteRoutes from './test-suite-qual-routes';
import testSuiteRoutes from './test-suite-routes';
import qualTestSuitesRoutes from './test-suites-qual-routes';
import testSuitesRoutes from './test-suites-routes';


const version = 'v1';

const v1Router = Router();

v1Router.get('/', (req, res) => res.json({ message: "Hi, we're up! Please provide the path to your desired endpoint" }));

v1Router.use(`/${appConfig.express.apiRoot}/${version}/test-suite`, testSuiteRoutes);

v1Router.use(`/${appConfig.express.apiRoot}/${version}/qual-test-suite`, qualTestSuiteRoutes);

v1Router.use(`/${appConfig.express.apiRoot}/${version}/custom-test-suite`, customTestSuiteRoutes);

v1Router.use(`/${appConfig.express.apiRoot}/${version}/test-data`, testDataRoutes);

v1Router.use(`/${appConfig.express.apiRoot}/${version}/test-suites`, testSuitesRoutes);

v1Router.use(`/${appConfig.express.apiRoot}/${version}/qual-test-suites`, qualTestSuitesRoutes);

v1Router.use(`/${appConfig.express.apiRoot}/${version}/custom-test-suites`, customTestSuitesRoutes);

export default v1Router;
