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
import { CreateQuantitativeTestResult } from '../domain/quantitative-test-result/create-quantitative-test-result';
import { CreateQualitativeTestResult } from '../domain/qualitative-test-result/create-qualitative-test-result';
import { ExecuteTest } from '../domain/test-execution-api/execute-test';
import QuantitativeTestResultRepo from './persistence/quantitative-test-result-repo';
import { SendQuantitativeSlackAlert } from '../domain/integration-api/slack/send-quantitative-alert';
import { SendQualitativeTestSlackAlert } from '../domain/integration-api/slack/send-qualitative-test-alert';
import { UpdateTestHistoryEntry } from '../domain/snowflake-api/update-test-history-entry';
import { CreateCustomTestSuite } from '../domain/custom-test-suite/create-custom-test-suite';
import { ReadCustomTestSuite } from '../domain/custom-test-suite/read-custom-test-suite';
import { ReadCustomTestSuites } from '../domain/custom-test-suite/read-custom-test-suites';
import { UpdateCustomTestSuite } from '../domain/custom-test-suite/update-custom-test-suite';
import { TriggerCustomTestSuiteExecution } from '../domain/custom-test-suite/trigger-custom-test-suite-execution';
import QualitativeTestResultRepo from './persistence/schema-change-test-result-repo';
import { CreateQualitativeTestSuites } from '../domain/qualitative-test-suite/create-qualitative-test-suites';
import { ReadQualitativeTestSuite } from '../domain/qualitative-test-suite/read-qualitative-test-suite';
import { ReadQualitativeTestSuites } from '../domain/qualitative-test-suite/read-qualitative-test-suites';
import { TriggerQualitativeTestSuiteExecution } from '../domain/qualitative-test-suite/trigger-qualitative-test-suite-execution';
import { UpdateQualitativeTestSuites } from '../domain/qualitative-test-suite/update-qualitative-test-suites';
import { TriggerTestSuiteExecution } from '../domain/test-suite/trigger-test-suite-execution';
import { QuerySnowflake } from '../domain/snowflake-api/query-snowflake';
import { GetSnowflakeProfile } from '../domain/integration-api/get-snowflake-profile';
import CustomTestSuiteRepo from './persistence/custom-test-suite-repo';
import QualitativeTestSuiteRepo from './persistence/qualitative-test-suite-repo';
import TestSuiteRepo from './persistence/test-suite-repo';
import SnowflakeApiRepo from './persistence/snowflake-api-repo';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createQuantitativeTestResult: asClass(CreateQuantitativeTestResult),
  createQualitativeTestResult: asClass(CreateQualitativeTestResult),

  createTestSuites: asClass(CreateTestSuites),
  createCustomTestSuite: asClass(CreateCustomTestSuite),
  createQualitativeTestSuites: asClass(CreateQualitativeTestSuites),

  readTestSuite: asClass(ReadTestSuite),
  readQualitativeTestSuite: asClass(ReadQualitativeTestSuite),
  readCustomTestSuite: asClass(ReadCustomTestSuite),

  readTestSuites: asClass(ReadTestSuites),
  readQualitativeTestSuites: asClass(ReadQualitativeTestSuites),
  readCustomTestSuites: asClass(ReadCustomTestSuites),

  updateTestSuites: asClass(UpdateTestSuites),
  updateQualitativeTestSuites: asClass(UpdateQualitativeTestSuites),
  updateCustomTestSuite: asClass(UpdateCustomTestSuite),

  triggerTestSuiteExecution: asClass(TriggerTestSuiteExecution),
  triggerQualitativeTestSuiteExecution: asClass(TriggerQualitativeTestSuiteExecution),
  triggerCustomTestSuiteExecution: asClass(TriggerCustomTestSuiteExecution),

  updateTestHistoryEntry: asClass(UpdateTestHistoryEntry),
  executeTest: asClass(ExecuteTest),

  getAccounts: asClass(GetAccounts),
  querySnowflake: asClass(QuerySnowflake),
  getSnowflakeProfile: asClass(GetSnowflakeProfile),
  sendQuantitativeSlackAlert: asClass(SendQuantitativeSlackAlert),
  sendQualitativeTestSlackAlert: asClass(SendQualitativeTestSlackAlert),

  quantitativeTestResultRepo: asClass(QuantitativeTestResultRepo),
  qualitativeTestResultRepo: asClass(QualitativeTestResultRepo),
  customTestSuiteRepo: asClass(CustomTestSuiteRepo),
  qualitativeTestSuiteRepo: asClass(QualitativeTestSuiteRepo),
  testSuiteRepo: asClass(TestSuiteRepo),

  snowflakeApiRepo: asClass(SnowflakeApiRepo),
  accountApiRepo: asClass(AccountApiRepo),
  integrationApiRepo: asClass(IntegrationApiRepo),
  testExecutionApiRepo: asClass(TestExecutionRepo),

  dbo: asClass(Dbo).singleton(),
});

export default iocRegister;
