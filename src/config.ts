const nodeEnv = process.env.NODE_ENV || 'development';
const defaultPort = 3000;
const port = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : defaultPort;
const apiRoot = process.env.API_ROOT || 'api';
const citoDataOrganizationId = process.env.CITO_ORGANIZATION_ID || '';

const getServiceDiscoveryNamespace = (): string | null => {
  switch (nodeEnv) {
    case 'development':
      return null;
    case 'test':
      return 'observability-staging';
    case 'production':
      return 'observability';
    default:
      throw new Error('No valid nodenv value provided');
  }
};

const getMessageResourceBaseUrl = (): string => {
  switch (nodeEnv) {
    case 'development':
      return `http://localhost:3006/lineage`;
    case 'test':
      return `https://www.app-staging.citodata.com/lineage`;
    case 'production':
      return `https://www.app.citodata.com/lineage`;
    default:
      throw new Error('nodenv type not found');
  }
};

const getAuthEnvConfig = (): any => {
  const authEnvConfig: any = {};

  authEnvConfig.authClientSecret = process.env.AUTH_CLIENT_SECRET || '';

  switch (nodeEnv) {
    case 'development':
      authEnvConfig.userPoolId = 'eu-central-1_0Z8JhFj8z';
      authEnvConfig.userPoolWebClientId = '';
      authEnvConfig.tokenUrl =
        '';
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
    apiRoot,
    citoDataOrganizationId
  },
  cloud: {
    serviceDiscoveryNamespace: getServiceDiscoveryNamespace(),
    authEnvConfig: getAuthEnvConfig(),
    region: 'eu-central-1'
  },
  slack: {
    resourceBaseUrl: getMessageResourceBaseUrl(),
  },
  mongodb: {
    ...getMongodbConfig(),
  },
};
