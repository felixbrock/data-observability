import {Router } from 'express';
import { appConfig } from '../../../config';
import customTestSuiteRoutes from './custom-test-suite-routes';
import customTestSuitesRoutes from './custom-test-suites-routes';
import testDataRoutes from './test-data-routes';
import testSuiteRoutes from './test-suite-routes';
import testSuitesRoutes from './test-suites-routes';


const version = 'v1';

const v1Router = Router();

v1Router.get('/', (req, res) => res.json({ message: "Yo! We're up!" }));

v1Router.use(`/${appConfig.express.apiRoot}/${version}/test-suite`, testSuiteRoutes);

v1Router.use(`/${appConfig.express.apiRoot}/${version}/custom-test-suite`, customTestSuiteRoutes);

v1Router.use(`/${appConfig.express.apiRoot}/${version}/test-data`, testDataRoutes);

v1Router.use(`/${appConfig.express.apiRoot}/${version}/test-suites`, testSuitesRoutes);

v1Router.use(`/${appConfig.express.apiRoot}/${version}/custom-test-suites`, customTestSuitesRoutes);

export default v1Router;
