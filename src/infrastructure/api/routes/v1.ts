import { Router } from 'express';
import { appConfig } from '../../../config';
import customTestSuiteRoutes from './custom-test-suite-routes';
import customTestSuitesRoutes from './custom-test-suites-routes';
import testDataRoutes from './anomaly-routes';
import qualTestSuiteRoutes from './qual-test-suite-routes';
import testSuiteRoutes from './test-suite-routes';
import qualTestSuitesRoutes from './qual-test-suites-routes';
import testSuitesRoutes from './test-suites-routes';
import frontEndRoutes from './front-end-routes';

const version = 'v1';

const v1Router = Router();

v1Router.get('/', (req, res) =>
  res.json({
    message: "Hi, we're up! Please provide the path to your desired endpoint",
  })
);

v1Router.use(
  `/${appConfig.express.apiRoot}/${version}/test-suite`,
  testSuiteRoutes
);

v1Router.use(
  `/${appConfig.express.apiRoot}/${version}/qual-test-suite`,
  qualTestSuiteRoutes
);

v1Router.use(
  `/${appConfig.express.apiRoot}/${version}/custom-test-suite`,
  customTestSuiteRoutes
);

v1Router.use(
  `/${appConfig.express.apiRoot}/${version}/anomaly`,
  testDataRoutes
);

v1Router.use(
  `/${appConfig.express.apiRoot}/${version}/test-suites`,
  testSuitesRoutes
);

v1Router.use(
  `/${appConfig.express.apiRoot}/${version}/qual-test-suites`,
  qualTestSuitesRoutes
);

v1Router.use(
  `/${appConfig.express.apiRoot}/${version}/custom-test-suites`,
  customTestSuitesRoutes
);

v1Router.use(
  `/${appConfig.express.apiRoot}/${version}/front-end`,
  frontEndRoutes
);

export default v1Router;
