import { InjectionMode, asClass, createContainer } from 'awilix';

import AccountApiRepo from './persistence/account-api-repo';
import { GetAccounts } from '../domain/account-api/get-accounts';
import { CreateTestSuites } from '../domain/test-suite/create-test-suites';
import Dbo from './persistence/db/mongo-db';
import { ReadTestSuites } from '../domain/test-suite/read-test-suites';
import { ReadTestSuite } from '../domain/test-suite/read-test-suite';
import { UpdateTestSuites } from '../domain/test-suite/update-test-suites';
import TestExecutionRepo from './persistence/test-execution-api-repo';
import { QuerySnowflake } from '../domain/integration-api/snowflake/query-snowflake';
import IntegrationApiRepo from './persistence/integration-api-repo';
import { CreateTestResult } from '../domain/test-result/create-test-result';
import { ExecuteTest } from '../domain/test-execution-api/execute-test';
import TestResultRepo from './persistence/test-result-repo';
import { SendSlackAlert } from '../domain/integration-api/slack/send-alert';
import { UpdateTestHistoryEntry } from '../domain/integration-api/snowflake/update-test-history-entry';
import { TriggerTestSuiteExecution } from '../domain/test-suite/trigger-test-suite-execution';
import { CreateCustomTestSuite } from '../domain/custom-test-suite/create-custom-test-suite';
import { ReadCustomTestSuite } from '../domain/custom-test-suite/read-custom-test-suite';
import { ReadCustomTestSuites } from '../domain/custom-test-suite/read-custom-test-suites';
import { UpdateCustomTestSuite } from '../domain/custom-test-suite/update-custom-test-suite';
import { TriggerCustomTestSuiteExecution } from '../domain/custom-test-suite/trigger-custom-test-suite-execution';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createTestResult: asClass(CreateTestResult),

  createCustomTestSuite: asClass(CreateCustomTestSuite),

  readCustomTestSuite: asClass(ReadCustomTestSuite),
  readCustomTestSuites: asClass(ReadCustomTestSuites),

  updateCustomTestSuite: asClass(UpdateCustomTestSuite),
  triggerCustomTestSuiteExecution: asClass(TriggerCustomTestSuiteExecution),

  createTestSuites: asClass(CreateTestSuites),

  readTestSuite: asClass(ReadTestSuite),
  readTestSuites: asClass(ReadTestSuites),

  updateTestSuites: asClass(UpdateTestSuites),
  triggerTestSuiteExecution: asClass(TriggerTestSuiteExecution),

  updateTestHistoryEntry: asClass(UpdateTestHistoryEntry),
  executeTest: asClass(ExecuteTest),

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
