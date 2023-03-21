import axios, { AxiosRequestConfig } from 'axios';
import {
  HandleQuantTestExecutionResult,
  HandleQuantTestExecutionResultAuthDto,
  HandleQuantTestExecutionResultRequestDto,
} from '../../../src/domain/test-execution-api/handle-quant-test-execution-result';
import iocRegister from '../../../src/infrastructure/ioc-register';

/* Debugging */
// https://stackoverflow.com/questions/33247602/how-do-you-debug-jest-tests

// node --inspect-brk node_modules/.bin/jest -- handle-quant-test-result.test.ts --runInBand

// npm test -- create-lineage.test.ts

export interface SystemInternalAuthConfig {
  clientSecret: string;
  clientId: string;
  tokenUrl: string;
}

const getSystemInternalAuthConfig = (): SystemInternalAuthConfig => {
  const clientSecret = '11ebmsj102ulmsljeqlomqq0bgo3155q8td0ui1t0d7rtek3ppqc';
  if (!clientSecret) throw new Error('auth client secret missing');

  const clientId = '54n1ig9sb07d4d9tiihdi0kifq';
  const tokenUrl = 'https://auth.citodata.com/oauth2/token';
  return { clientSecret, clientId, tokenUrl };
};

const getJwt = async (): Promise<string> => {
  try {
    const authConfig = getSystemInternalAuthConfig();

    const configuration: AxiosRequestConfig = {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${authConfig.clientId}:${authConfig.clientSecret}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      params: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: authConfig.clientId,
      }),
    };

    const response = await axios.post(
      authConfig.tokenUrl,
      undefined,
      configuration
    );
    const jsonResponse = response.data;
    if (response.status !== 200) throw new Error(jsonResponse.message);
    if (!jsonResponse.access_token)
      throw new Error('Did not receive an access token');
    return jsonResponse.access_token;
  } catch (error: unknown) {
    if (error instanceof Error) console.error(error.stack);
    else if (error) console.trace(error);
    return Promise.reject(new Error(''));
  }
};

test('lineage creation', async () => {
  const jwt = await getJwt();

  const handleQuantTestResult: HandleQuantTestExecutionResult =
    iocRegister.resolve('handleQuantTestResult');

  const reqDto: HandleQuantTestExecutionResultRequestDto = {
    testSuiteId: '00587b3e-fb7b-4d28-945e-9fc85747a357',
    testType: 'ColumnFreshness',
    executionId: '6d0ed26c-d81e-4c82-8dbb-2acea2037d7a',
    targetResourceId: 'e3bc08d2-4e2e-44e1-b7cf-21caed82c672',
    organizationId: '631789bf27518f97cf1c82b7',
    isWarmup: false,
    testData: {
      executedOn: '2023-01-19T18:57:12.113965',
      anomaly: {
        isAnomaly: true,
        importance: 0.393,
      },
      modifiedZScore: 0.2447081854888046,
      deviation: 0.023391812865497075,
    },
    alertData: {
      alertId: 'a7460b45-5a56-4195-b786-0a16c34147df',
      message:
        '<__base_url__?targetResourceId=e3bc08d2-4e2e-44e1-b7cf-21caed82c672&ampisColumn=True|DM.Sales.SF_TASKS.LASTMODIFIEDDATE>',
      databaseName: 'DM',
      schemaName: 'Sales',
      materializationName: 'SF_TASKS',
      materializationType: 'Table',
      expectedValue: 171.0,
      expectedUpperBound: 220.038,
      expectedLowerBound: 121.962,
      columnName: 'LASTMODIFIEDDATE',
      value: 175,
    },
  };

  const auth: HandleQuantTestExecutionResultAuthDto = {
    jwt,
    isSystemInternal: true,
  };

  const dbo = iocRegister.resolve('dbo');
  const result = await handleQuantTestResult.execute({
    req: reqDto,
    auth,
    db: dbo.dbConnection,
  });

  if (!result.success) throw new Error(result.error);

  console.log(result.value);

  expect(result.success).toBe(true);
});
