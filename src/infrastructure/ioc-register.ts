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
import { CreateAnomalyTestResult } from '../domain/anomaly-test-result/create-anomaly-test-result';
import { CreateSchemaChangeTestResult } from '../domain/schema-change-test-result/create-schema-change-test-result';
import { ExecuteTest } from '../domain/test-execution-api/execute-test';
import AnomalyTestResultRepo from './persistence/anomaly-test-result-repo';
import { SendAnomalySlackAlert } from '../domain/integration-api/slack/send-anomaly-alert';
import { SendSchemaChangeSlackAlert } from '../domain/integration-api/slack/send-schema-change-alert';
import { UpdateTestHistoryEntry } from '../domain/integration-api/snowflake/update-test-history-entry';
import { TriggerTestSuiteExecution } from '../domain/test-suite/trigger-test-suite-execution';
import { CreateCustomTestSuite } from '../domain/custom-test-suite/create-custom-test-suite';
import { ReadCustomTestSuite } from '../domain/custom-test-suite/read-custom-test-suite';
import { ReadCustomTestSuites } from '../domain/custom-test-suite/read-custom-test-suites';
import { UpdateCustomTestSuite } from '../domain/custom-test-suite/update-custom-test-suite';
import { TriggerCustomTestSuiteExecution } from '../domain/custom-test-suite/trigger-custom-test-suite-execution';
import SchemaChangeTestResultRepo from './persistence/schema-change-test-result-repo';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createAnomalyTestResult: asClass(CreateAnomalyTestResult),
  createSchemaChangeTestResult: asClass(CreateSchemaChangeTestResult),

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
  sendAnomalySlackAlert: asClass(SendAnomalySlackAlert),
  sendSchemaChangeSlackAlert: asClass(SendSchemaChangeSlackAlert),

  anomalyTestResultRepo: asClass(AnomalyTestResultRepo),
  schemaChangeTestResultRepo: asClass(SchemaChangeTestResultRepo),

  accountApiRepo: asClass(AccountApiRepo),
  integrationApiRepo: asClass(IntegrationApiRepo),
  testExecutionApiRepo: asClass(TestExecutionRepo),

  dbo: asClass(Dbo).singleton(),
});

export default iocRegister;
