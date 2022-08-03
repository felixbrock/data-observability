export const nodeEnv = process.env.NODE_ENV || 'development';
export const defaultPort = 3000;
export const port = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : defaultPort;
export const apiRoot = process.env.API_ROOT || 'api';
export const citoDataOrganizationId = process.env.CITO_ORGANIZATION_ID || '';

const getServiceDiscoveryNamespace = (): string => {
  let namespace = '';

  switch (nodeEnv) {
    case 'test':
      namespace = 'hivedive-test';
      break;
    case 'production':
      namespace = 'hivedive';
      break;
    default:
      break;
  }

  return namespace;
};

export const serviceDiscoveryNamespace = getServiceDiscoveryNamespace();

const getAuthEnvConfig = (): any => {
  const authEnvConfig: any = {};

  authEnvConfig.authClientSecret = process.env.AUTH_CLIENT_SECRET || '';

  switch (nodeEnv) {
    case 'development':
      authEnvConfig.userPoolId = 'eu-central-1_NVHpLpAIc';
      authEnvConfig.userPoolWebClientId = '13s39d3csd2t31stlu54p6q5a4';
      authEnvConfig.tokenUrl = 'https://citodata.auth.eu-central-1.amazoncognito.com/oauth2/token';
      break;
    case 'test':
      authEnvConfig.userPoolId = '';
      authEnvConfig.userPoolWebClientId = '';
      authEnvConfig.tokenUrl = '';
      break;
    case 'production':
      authEnvConfig.userPoolId = '';
      authEnvConfig.userPoolWebClientId = '';
      authEnvConfig.tokenUrl = '';
      break;
    default:
      break;
  }

  return authEnvConfig;
};

export const authEnvConfig = getAuthEnvConfig();

export interface MongoDbConfig {
  url: string;
  dbName: string;
}

const getMongodbConfig = (): MongoDbConfig => {
  switch (nodeEnv) {
    case 'development':
      return {
        url: process.env.DATABASE_DEV_URL || '',
        dbName: process.env.DATABASE_DEV_NAME || '',
      };
    case 'test':
      return {
        url: process.env.DATABASE_TEST_URL || '',
        dbName: process.env.DATABASE_TEST_NAME || '',
      };
    case 'production':
      return {
        url: process.env.DATABASE_URL || '',
        dbName: process.env.DATABASE_NAME || '',
      };
    default:
      return {
        url: process.env.DATABASE_DEV_URL || '',
        dbName: process.env.DATABASE_DEV_URL || '',
      };
  }
};

export const appConfig = {
  express: {
    port,
    mode: nodeEnv,
  },
  mongodb: {
    ...getMongodbConfig(),
  },
};
