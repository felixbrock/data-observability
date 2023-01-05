import { InjectionMode, asClass, createContainer } from 'awilix';

import AccountApiRepo from './persistence/account-api-repo';
import { GetAccounts } from '../domain/account-api/get-accounts';
import { CreateTestSuites } from '../domain/test-suite/create-test-suites';
import Dbo from './persistence/db/mongo-db';
import { ReadTestSuites } from '../domain/test-suite/read-test-suites';
import { ReadTestSuite } from '../domain/test-suite/read-test-suite';
import { UpdateTestSuites } from '../domain/test-suite/update-test-suites';
import TestExecutionRepo from './persistence/test-execution-api-repo';
import IntegrationApiRepo from './persistence/integration-api-repo';
import { CreateQuantTestResult } from '../domain/quantitative-test-result/create-quantitative-test-result';
import { CreateQualTestResult } from '../domain/qualitative-test-result/create-qualitative-test-result';
import { ExecuteTest } from '../domain/test-execution-api/execute-test';
import QuantTestResultRepo from './persistence/quantitative-test-result-repo';
import { SendQuantSlackAlert } from '../domain/integration-api/slack/send-quantitative-test-alert';
import { SendQualTestSlackAlert } from '../domain/integration-api/slack/send-qualitative-test-alert';
import { UpdateTestHistoryEntry } from '../domain/snowflake-api/update-test-history-entry';
import { CreateCustomTestSuite } from '../domain/custom-test-suite/create-custom-test-suite';
import { ReadCustomTestSuite } from '../domain/custom-test-suite/read-custom-test-suite';
import { ReadCustomTestSuites } from '../domain/custom-test-suite/read-custom-test-suites';
import { UpdateCustomTestSuite } from '../domain/custom-test-suite/update-custom-test-suite';
import { TriggerCustomTestSuiteExecution } from '../domain/custom-test-suite/trigger-custom-test-suite-execution';
import QualTestResultRepo from './persistence/schema-change-test-result-repo';
import { CreateQualTestSuites } from '../domain/qualitative-test-suite/create-qualitative-test-suites';
import { ReadQualTestSuite } from '../domain/qualitative-test-suite/read-qualitative-test-suite';
import { ReadQualTestSuites } from '../domain/qualitative-test-suite/read-qualitative-test-suites';
import { TriggerQualTestSuiteExecution } from '../domain/qualitative-test-suite/trigger-qualitative-test-suite-execution';
import { UpdateQualTestSuites } from '../domain/qualitative-test-suite/update-qualitative-test-suites';
import { TriggerTestSuiteExecution } from '../domain/test-suite/trigger-test-suite-execution';
import { QuerySnowflake } from '../domain/snowflake-api/query-snowflake';
import { GetSnowflakeProfile } from '../domain/integration-api/get-snowflake-profile';
import CustomTestSuiteRepo from './persistence/custom-test-suite-repo';
import QualTestSuiteRepo from './persistence/qualitative-test-suite-repo';
import TestSuiteRepo from './persistence/test-suite-repo';
import SnowflakeApiRepo from './persistence/snowflake-api-repo';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createQuantTestResult: asClass(CreateQuantTestResult),
  createQualTestResult: asClass(CreateQualTestResult),

  createTestSuites: asClass(CreateTestSuites),
  createCustomTestSuite: asClass(CreateCustomTestSuite),
  createQualTestSuites: asClass(CreateQualTestSuites),

  readTestSuite: asClass(ReadTestSuite),
  readQualTestSuite: asClass(ReadQualTestSuite),
  readCustomTestSuite: asClass(ReadCustomTestSuite),

  readTestSuites: asClass(ReadTestSuites),
  readQualTestSuites: asClass(ReadQualTestSuites),
  readCustomTestSuites: asClass(ReadCustomTestSuites),

  updateTestSuites: asClass(UpdateTestSuites),
  updateQualTestSuites: asClass(UpdateQualTestSuites),
  updateCustomTestSuite: asClass(UpdateCustomTestSuite),

  triggerTestSuiteExecution: asClass(TriggerTestSuiteExecution),
  triggerQualTestSuiteExecution: asClass(TriggerQualTestSuiteExecution),
  triggerCustomTestSuiteExecution: asClass(TriggerCustomTestSuiteExecution),

  updateTestHistoryEntry: asClass(UpdateTestHistoryEntry),
  executeTest: asClass(ExecuteTest),

  getAccounts: asClass(GetAccounts),
  querySnowflake: asClass(QuerySnowflake),
  getSnowflakeProfile: asClass(GetSnowflakeProfile),
  sendQuantSlackAlert: asClass(SendQuantSlackAlert),
  sendQualTestSlackAlert: asClass(SendQualTestSlackAlert),

  quantTestResultRepo: asClass(QuantTestResultRepo),
  qualTestResultRepo: asClass(QualTestResultRepo),
  customTestSuiteRepo: asClass(CustomTestSuiteRepo),
  qualTestSuiteRepo: asClass(QualTestSuiteRepo),
  testSuiteRepo: asClass(TestSuiteRepo),

  snowflakeApiRepo: asClass(SnowflakeApiRepo),
  accountApiRepo: asClass(AccountApiRepo),
  integrationApiRepo: asClass(IntegrationApiRepo),
  testExecutionApiRepo: asClass(TestExecutionRepo),

  dbo: asClass(Dbo).singleton(),
});

export default iocRegister;
