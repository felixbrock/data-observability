const nodeEnv = process.env.NODE_ENV || 'development';
const defaultPort = 3000;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : defaultPort;
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

export interface AuthSchedulerEnvConfig {
  clientSecret: string;
  clientId: string;
  tokenUrl: string;
}

const getAuthSchedulerEnvConfig = (): AuthSchedulerEnvConfig => {
  switch (nodeEnv) {
    case 'development': {
      const clientSecret = process.env.AUTH_SCHEDULER_CLIENT_SECRET_DEV || '';
      if (!clientSecret) throw new Error('auth client secret missing');

      const clientId = '3o029nji154v0bm109hkvkoi5h';
      const tokenUrl =
        'https://auth-cito-dev.auth.eu-central-1.amazoncognito.com/oauth2/token';
      return { clientSecret, clientId, tokenUrl };
    }
    case 'test': {
      const clientSecret =
        process.env.AUTH_SCHEDULER_CLIENT_SECRET_STAGING || '';
      if (!clientSecret) throw new Error('auth client secret missing');

      const clientId = '';
      const tokenUrl = '';
      return { clientSecret, clientId, tokenUrl };
    }
    case 'production': {
      const clientSecret = process.env.AUTH_SCHEDULER_CLIENT_SECRET_PROD || '';
      if (!clientSecret) throw new Error('auth client secret missing');

      const clientId = '';
      const tokenUrl = '';
      return { clientSecret, clientId, tokenUrl };
    }
    default:
      throw new Error('node env misconfiguration');
  }
};

const getAuthEnvConfig = (): any => {
  const authEnvConfig: any = {};

  switch (nodeEnv) {
    case 'development':
      authEnvConfig.userPoolId = 'eu-central-1_0Z8JhFj8z';
      authEnvConfig.userPoolWebClientId = '2kt5cdpsbfc53sokgii4l5lecc';
      break;
    case 'test':
      authEnvConfig.userPoolId = '';
      authEnvConfig.userPoolWebClientId = '';
      break;
    case 'production':
      authEnvConfig.userPoolId = 'eu-central-1_0muGtKMk3';
      authEnvConfig.userPoolWebClientId = '90hkfejkd81bp3ta5gd80hanp';
      break;
    default:
      throw new Error('node env misconfiguration');
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
    citoDataOrganizationId,
  },
  cloud: {
    serviceDiscoveryNamespace: getServiceDiscoveryNamespace(),
    authEnvConfig: getAuthEnvConfig(),
    authSchedulerEnvConfig: getAuthSchedulerEnvConfig(),
    region: 'eu-central-1',
  },
  slack: {
    resourceBaseUrl: getMessageResourceBaseUrl(),
  },
  mongodb: {
    ...getMongodbConfig(),
  },
};
