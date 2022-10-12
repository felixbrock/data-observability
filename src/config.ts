import dotenv from 'dotenv';

import path from 'path';

const dotenvConfig =
  process.env.NODE_ENV === 'development'
    ? { path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`) }
    : {};
dotenv.config(dotenvConfig);

export interface AuthSchedulerEnvConfig {
  clientSecret: string;
  clientId: string;
  tokenUrl: string;
}

const getAuthSchedulerEnvConfig = (): AuthSchedulerEnvConfig => {
  const clientSecret = process.env.SYSTEM_INTERNAL_AUTH_CLIENT_SECRET;
  const clientId = process.env.SYSTEM_INTERNAL_AUTH_CLIENT_ID;
  const tokenUrl = process.env.SYSTEM_INTERNAL_AUTH_TOKEN_URL;

  if (!clientSecret || !clientId || !tokenUrl)
    throw new Error('missing auth scheduler env values');

  return { clientSecret, clientId, tokenUrl };
};

interface AuthEnvConfig {
  userPoolId: string;
  userPoolWebClientId: string;
}

const getAuthEnvConfig = (): AuthEnvConfig => {
  const userPoolId = process.env.USER_POOL_ID;
  const userPoolWebClientId = process.env.USER_POOL_WEB_CLIENT_ID;

  if (!userPoolId || !userPoolWebClientId)
    throw new Error('missing auth env values');

  return { userPoolId, userPoolWebClientId };
};

export interface MongoDbConfig {
  url: string;
  dbName: string;
}

const getMongodbConfig = (): MongoDbConfig => {
  const url = process.env.DATABASE_URL || '';
  const dbName = process.env.DATABASE_NAME || '';

  if (!url || !dbName) throw new Error('Missing Mongo DB env values');

  return { url, dbName };
};

export interface SlackConfig {
  callbackRoot: string;
}

const getSlackConfig = (): SlackConfig => {
  const callbackRoot = process.env.SLACK_ALERT_CALLBACK_ROOT;

  if (!callbackRoot) throw new Error('Missing Slack env values');

  return { callbackRoot };
};

export interface BaseUrlConfig {
  testEngine: string;
  integrationService: string;
  accountService: string;
}

const getBaseUrlConfig = (): BaseUrlConfig => {
  const testEngine = process.env.BASE_URL_TEST_ENGINE;
  const integrationService = process.env.BASE_URL_INTEGRATION_SERVICE;
  const accountService = process.env.BASE_URL_ACCOUNT_SERVICE;

  if (!testEngine || !integrationService || !accountService)
    throw new Error('Missing Base url env values');

  return { testEngine, integrationService, accountService };
};

export const appConfig = {
  express: {
    mode: process.env.NODE_ENV || 'development',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    apiRoot: process.env.API_ROOT || 'api',
    citoDataOrganizationId: process.env.CITO_ORGANIZATION_ID || '',
  },
  cloud: {
    authEnvConfig: getAuthEnvConfig(),
    authSchedulerEnvConfig: getAuthSchedulerEnvConfig(),
    region: 'eu-central-1',
  },
  slack: getSlackConfig(),
  baseUrl: getBaseUrlConfig(),
  mongodb: getMongodbConfig(),
};
