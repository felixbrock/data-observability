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

export const authUsername = process.env.AUTH_PASSWORD || '';
export const authPassword = process.env.AUTH_USERNAME || '';

const getAuthEnvConfig = (): any => {
  const authEnvConfig: any = {};

  switch (nodeEnv) {
    case 'development':
      authEnvConfig.userPoolId = 'eu-central-1_NVHpLpAIc';
      authEnvConfig.userPoolWebClientId = '7r8dtcts83hpk6evns2gaj82r0';
      break;
    case 'test':
      authEnvConfig.userPoolId = '';
      authEnvConfig.userPoolWebClientId = '';
      break;
    case 'production':
      authEnvConfig.userPoolId = '';
      authEnvConfig.userPoolWebClientId = '';
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
