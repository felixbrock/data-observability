import { InjectionMode, asClass, createContainer } from 'awilix';

import AccountApiRepo from './persistence/account-api-repo';
import { GetAccounts } from '../domain/account-api/get-accounts';
import { CreateTestSuite } from '../domain/test-suite/create-test-suite';
import Dbo from './persistence/db/mongo-db';
import { ReadTestSuites } from '../domain/test-suite/read-test-suites';
import { ReadTestSuite } from '../domain/test-suite/read-test-suite';
import { UpdateTestSuite } from '../domain/test-suite/update-test-suite';
import TestExecutionRepo from './persistence/test-execution-api-repo';
import { QuerySnowflake } from '../domain/integration-api/snowflake/query-snowflake';
import IntegrationApiRepo from './persistence/integration-api-repo';
import { CreateTestResult } from '../domain/test-result/create-test-result';
import { ExecuteTest } from '../domain/test-execution-api/execute-test';
import TestResultRepo from './persistence/test-result-repo';
import { SendSlackAlert } from '../domain/integration-api/slack/send-alert';
import { UpdateTestHistoryEntry } from '../domain/test-suite/update-test-history-entry';
import { TriggerTestSuiteExecution } from '../domain/test-suite/trigger-test-execution';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createTestResult: asClass(CreateTestResult),
  createTestSuite: asClass(CreateTestSuite),

  readTestSuite: asClass(ReadTestSuite),
  readTestSuites: asClass(ReadTestSuites),

  updateTestSuite: asClass(UpdateTestSuite),
  updateTestHistoryEntry: asClass(UpdateTestHistoryEntry),

  executeTest: asClass(ExecuteTest),
  triggerTestSuiteExecution: asClass(TriggerTestSuiteExecution),

  getAccounts: asClass(GetAccounts),
  querySnowflake: asClass(QuerySnowflake),
  sendSlackAlert: asClass(SendSlackAlert),

  testResultRepo: asClass(TestResultRepo),

  accountApiRepo: asClass(AccountApiRepo),
  integrationApiRepo: asClass(IntegrationApiRepo),
  testExecutionApiRepo: asClass(TestExecutionRepo),

  dbo: asClass(Dbo).singleton(),
});

export default iocRegister;
