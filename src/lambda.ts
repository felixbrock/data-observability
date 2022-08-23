import serverlessExpress from '@vendia/serverless-express';
import { Application } from 'express';
import ExpressApp from './infrastructure/api/express-app';
import { appConfig } from './config';

let serverlessExpressInstance: any;

const asyncTask = (): Promise<Application> => {
  const expressApp = new ExpressApp(appConfig.express);

  return expressApp.start(false);
};

const setup = async (event: any, context: any): Promise<any> => {
  const app = await asyncTask();
  serverlessExpressInstance = serverlessExpress({ app });
  return serverlessExpressInstance(event, context);
};

// eslint-disable-next-line import/prefer-default-export
export const handler = (event: any, context: any): any => {
  if (serverlessExpressInstance)
    return serverlessExpressInstance(event, context);

  return setup(event, context);
};
