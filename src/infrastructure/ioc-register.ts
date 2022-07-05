import { InjectionMode, asClass, createContainer } from 'awilix';

import AccountApiRepo from './persistence/account-api-repo';
import { GetAccounts } from '../domain/account-api/get-accounts';
import { CreateExpectation } from '../domain/test-suite/create-expectation';
import { CreateJob } from '../domain/test-suite/create-job';
import { CreateTestSuite } from '../domain/test-suite/create-test-suite';
import TestSuiteRepo from './persistence/test-suite-repo';
import Dbo from './persistence/db/mongo-db';
import { ValidateData } from '../domain/data-validation-api/validate-data';
import { ReadTestSuites } from '../domain/test-suite/read-test-suites';
import DataValidationApiRepo from './persistence/data-validation-api-repo';
import { ReadTestSuite } from '../domain/test-suite/read-test-suite';
import { UpdateTestSuite } from '../domain/test-suite/update-test-suite';
import DataValidationResultRepo from './persistence/data-validation-result-repo';
import { CreateDataValidationResult } from '../domain/data-validation-result/create-data-validation-result';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createExpectation: asClass(CreateExpectation),
  createDataValidationResult: asClass(CreateDataValidationResult),
  createJob: asClass(CreateJob),
  createTestSuite: asClass(CreateTestSuite),

  readTestSuite: asClass(ReadTestSuite),
  readTestSuites: asClass(ReadTestSuites),

  updateTestSuite: asClass(UpdateTestSuite),

  getAccounts: asClass(GetAccounts),
  validateData: asClass (ValidateData),

  testSuiteRepo: asClass(TestSuiteRepo),
  dataValidationResultRepo: asClass(DataValidationResultRepo),

  accountApiRepo: asClass(AccountApiRepo),
  dataValidationApiRepo: asClass(DataValidationApiRepo),

  dbo: asClass(Dbo).singleton()
});

export default iocRegister;
