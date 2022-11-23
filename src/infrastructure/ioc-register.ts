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
import { CreateAnomalyTestResult } from '../domain/anomaly-test-result/create-anomaly-test-result';
import { CreateNominalTestResult } from '../domain/nominal-test-result/create-nominal-test-result';
import { ExecuteTest } from '../domain/test-execution-api/execute-test';
import AnomalyTestResultRepo from './persistence/anomaly-test-result-repo';
import { SendAnomalySlackAlert } from '../domain/integration-api/slack/send-anomaly-alert';
import { SendNominalTestSlackAlert } from '../domain/integration-api/slack/send-nominal-test-alert';
import { UpdateTestHistoryEntry } from '../domain/snowflake-api/update-test-history-entry';
import { CreateCustomTestSuite } from '../domain/custom-test-suite/create-custom-test-suite';
import { ReadCustomTestSuite } from '../domain/custom-test-suite/read-custom-test-suite';
import { ReadCustomTestSuites } from '../domain/custom-test-suite/read-custom-test-suites';
import { UpdateCustomTestSuite } from '../domain/custom-test-suite/update-custom-test-suite';
import { TriggerCustomTestSuiteExecution } from '../domain/custom-test-suite/trigger-custom-test-suite-execution';
import NominalTestResultRepo from './persistence/schema-change-test-result-repo';
import { CreateNominalTestSuites } from '../domain/nominal-test-suite/create-nominal-test-suites';
import { ReadNominalTestSuite } from '../domain/nominal-test-suite/read-nominal-test-suite';
import { ReadNominalTestSuites } from '../domain/nominal-test-suite/read-nominal-test-suites';
import { TriggerNominalTestSuiteExecution } from '../domain/nominal-test-suite/trigger-nominal-test-suite-execution';
import { UpdateNominalTestSuites } from '../domain/nominal-test-suite/update-nominal-test-suites';
import { TriggerTestSuiteExecution } from '../domain/test-suite/trigger-test-suite-execution';
import { QuerySnowflake } from '../domain/snowflake-api/query-snowflake';
import { GetSnowflakeProfile } from '../domain/integration-api/get-snowflake-profile';
import CustomTestSuiteRepo from './persistence/custom-test-suite-repo';
import NominalTestSuiteRepo from './persistence/nominal-test-suite-repo';
import TestSuiteRepo from './persistence/test-suite-repo';
import SnowflakeApiRepo from './persistence/snowflake-api-repo';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createAnomalyTestResult: asClass(CreateAnomalyTestResult),
  createNominalTestResult: asClass(CreateNominalTestResult),

  createTestSuites: asClass(CreateTestSuites),
  createCustomTestSuite: asClass(CreateCustomTestSuite),
  createNominalTestSuites: asClass(CreateNominalTestSuites),

  readTestSuite: asClass(ReadTestSuite),
  readNominalTestSuite: asClass(ReadNominalTestSuite),
  readCustomTestSuite: asClass(ReadCustomTestSuite),

  readTestSuites: asClass(ReadTestSuites),
  readNominalTestSuites: asClass(ReadNominalTestSuites),
  readCustomTestSuites: asClass(ReadCustomTestSuites),

  updateTestSuites: asClass(UpdateTestSuites),
  updateNominalTestSuites: asClass(UpdateNominalTestSuites),
  updateCustomTestSuite: asClass(UpdateCustomTestSuite),

  triggerTestSuiteExecution: asClass(TriggerTestSuiteExecution),
  triggerNominalTestSuiteExecution: asClass(TriggerNominalTestSuiteExecution),
  triggerCustomTestSuiteExecution: asClass(TriggerCustomTestSuiteExecution),

  updateTestHistoryEntry: asClass(UpdateTestHistoryEntry),
  executeTest: asClass(ExecuteTest),

  getAccounts: asClass(GetAccounts),
  querySnowflake: asClass(QuerySnowflake),
  getSnowflakeProfile: asClass(GetSnowflakeProfile),
  sendAnomalySlackAlert: asClass(SendAnomalySlackAlert),
  sendNominalTestSlackAlert: asClass(SendNominalTestSlackAlert),

  anomalyTestResultRepo: asClass(AnomalyTestResultRepo),
  nominalTestResultRepo: asClass(NominalTestResultRepo),
  customTestSuiteRepo: asClass(CustomTestSuiteRepo),
  nominalTestSuiteRepo: asClass(NominalTestSuiteRepo),
  testSuiteRepo: asClass(TestSuiteRepo),

  snowflakeApiRepo: asClass(SnowflakeApiRepo),
  accountApiRepo: asClass(AccountApiRepo),
  integrationApiRepo: asClass(IntegrationApiRepo),
  testExecutionApiRepo: asClass(TestExecutionRepo),

  dbo: asClass(Dbo).singleton(),
});

export default iocRegister;
