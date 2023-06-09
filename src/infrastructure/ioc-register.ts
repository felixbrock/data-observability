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
import { ExecuteTest } from '../domain/test-execution-api/execute-test';
import { SendQuantTestSlackAlert } from '../domain/integration-api/slack/send-quant-test-alert';
import { SendQualTestSlackAlert } from '../domain/integration-api/slack/send-qual-test-alert';
import { PostAnomalyFeedback } from '../domain/snowflake-api/post-anomaly-feedback';
import { CreateCustomTestSuite } from '../domain/custom-test-suite/create-custom-test-suite';
import { ReadCustomTestSuite } from '../domain/custom-test-suite/read-custom-test-suite';
import { ReadCustomTestSuites } from '../domain/custom-test-suite/read-custom-test-suites';
import { UpdateCustomTestSuite } from '../domain/custom-test-suite/update-custom-test-suite';
import { TriggerCustomTestSuiteExecution } from '../domain/custom-test-suite/trigger-custom-test-suite-execution';
import { CreateQualTestSuites } from '../domain/qual-test-suite/create-qual-test-suites';
import { ReadQualTestSuite } from '../domain/qual-test-suite/read-qual-test-suite';
import { ReadQualTestSuites } from '../domain/qual-test-suite/read-qual-test-suites';
import { TriggerQualTestSuiteExecution } from '../domain/qual-test-suite/trigger-qual-test-suite-execution';
import { UpdateQualTestSuites } from '../domain/qual-test-suite/update-qual-test-suites';
import { TriggerTestSuiteExecution } from '../domain/test-suite/trigger-test-suite-execution';
import { QuerySnowflake } from '../domain/snowflake-api/query-snowflake';
import { GetSnowflakeProfile } from '../domain/integration-api/get-snowflake-profile';
import CustomTestSuiteRepo from './persistence/custom-test-suite-repo';
import QualTestSuiteRepo from './persistence/qual-test-suite-repo';
import TestSuiteRepo from './persistence/test-suite-repo';
import SnowflakeApiRepo from './persistence/snowflake-api-repo';
import { HandleQuantTestExecutionResult } from '../domain/test-execution-api/handle-quant-test-execution-result';
import { HandleQualTestExecutionResult } from '../domain/test-execution-api/handle-qual-test-execution-result';
import { GenerateChart } from '../domain/integration-api/slack/chart/generate-chart';
import { DeleteTestSuites } from '../domain/test-suite/delete-test-suites';
import { DeleteQualTestSuites } from '../domain/qual-test-suite/delete-qual-test-suites';
import { DeleteCustomTestSuites } from '../domain/custom-test-suite/delete-custom-test-suites';
import { DeleteCustomTestSuite } from '../domain/custom-test-suite/delete-custom-test-suite';
import { DeleteTestSuiteDuplicates } from '../domain/test-suite/delete-test-suite-duplicates';
import { ReadTestHistory } from '../domain/custom-query/read-test-history';
import { ReadAlertHistory } from '../domain/custom-query/read-alert-history';
import CustomQueryRepo from './persistence/custom-query-repo';
import { HandleCustomTestExecutionResult } from '../domain/test-execution-api/handle-custom-test-execution-result';
import { SendCustomTestSlackAlert } from '../domain/integration-api/slack/send-custom-test-alert';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
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

  deleteTestSuites: asClass(DeleteTestSuites),
  deleteTestSuiteDuplicates: asClass(DeleteTestSuiteDuplicates),
  deleteQualTestSuites: asClass(DeleteQualTestSuites),
  deleteCustomTestSuites: asClass(DeleteCustomTestSuites),
  deleteCustomTestSuite: asClass(DeleteCustomTestSuite),

  triggerTestSuiteExecution: asClass(TriggerTestSuiteExecution),
  triggerQualTestSuiteExecution: asClass(TriggerQualTestSuiteExecution),
  triggerCustomTestSuiteExecution: asClass(TriggerCustomTestSuiteExecution),

  handleQuantTestExecutionResult: asClass(HandleQuantTestExecutionResult),
  handleQualTestExecutionResult: asClass(HandleQualTestExecutionResult),
  handleCustomTestExecutionResult: asClass(HandleCustomTestExecutionResult),

  postAnomalyFeedback: asClass(PostAnomalyFeedback),
  executeTest: asClass(ExecuteTest),

  getAccounts: asClass(GetAccounts),
  querySnowflake: asClass(QuerySnowflake),
  getSnowflakeProfile: asClass(GetSnowflakeProfile),
  sendQuantTestSlackAlert: asClass(SendQuantTestSlackAlert),
  sendQualTestSlackAlert: asClass(SendQualTestSlackAlert),
  sendCustomTestSlackAlert: asClass(SendCustomTestSlackAlert),
  generateChart: asClass(GenerateChart),

  customTestSuiteRepo: asClass(CustomTestSuiteRepo),
  qualTestSuiteRepo: asClass(QualTestSuiteRepo),
  testSuiteRepo: asClass(TestSuiteRepo),

  snowflakeApiRepo: asClass(SnowflakeApiRepo),
  accountApiRepo: asClass(AccountApiRepo),
  integrationApiRepo: asClass(IntegrationApiRepo),
  testExecutionApiRepo: asClass(TestExecutionRepo),

  readTestHistory: asClass(ReadTestHistory),
  readAlertHistory: asClass(ReadAlertHistory),

  customQueryRepo: asClass(CustomQueryRepo),



  dbo: asClass(Dbo).singleton(),
});

export default iocRegister;
