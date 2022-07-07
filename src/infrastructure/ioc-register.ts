import { InjectionMode, asClass, createContainer } from 'awilix';

import AccountApiRepo from './persistence/account-api-repo';
import { GetAccounts } from '../domain/account-api/get-accounts';
import { CreateTestSuite } from '../domain/test-suite/create-test-suite';
import TestSuiteRepo from './persistence/test-suite-repo';
import Dbo from './persistence/db/mongo-db';
import { ValidateData } from '../domain/data-validation-api/validate-data';
import { ReadTestSuites } from '../domain/test-suite/read-test-suites';
import DataValidationApiRepo from './persistence/data-validation-api-repo';
import { ReadTestSuite } from '../domain/test-suite/read-test-suite';
import { UpdateTestSuite } from '../domain/test-suite/update-test-suite';
import TestExecutionRepo from './persistence/test-execution-repo';
import { CreateTestExecution } from '../domain/test-execution/create-test-execution';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createTestExecution: asClass(CreateTestExecution),
  createTestSuite: asClass(CreateTestSuite),

  readTestSuite: asClass(ReadTestSuite),
  readTestSuites: asClass(ReadTestSuites),

  updateTestSuite: asClass(UpdateTestSuite),

  getAccounts: asClass(GetAccounts),
  validateData: asClass (ValidateData),

  testSuiteRepo: asClass(TestSuiteRepo),
  testExecutionRepo: asClass(TestExecutionRepo),

  accountApiRepo: asClass(AccountApiRepo),
  dataValidationApiRepo: asClass(DataValidationApiRepo),

  dbo: asClass(Dbo).singleton()
});

export default iocRegister;
