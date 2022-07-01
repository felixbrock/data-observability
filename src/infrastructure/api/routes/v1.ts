import {Router } from 'express';
import { apiRoot } from '../../../config';
import testSuiteRoutes from './test-suite-routes';


const version = 'v1';

const v1Router = Router();

v1Router.get('/', (req, res) => res.json({ message: "Yo! We're up!" }));


v1Router.use(`/${apiRoot}/${version}/test-suite`, testSuiteRoutes);

export default v1Router;
