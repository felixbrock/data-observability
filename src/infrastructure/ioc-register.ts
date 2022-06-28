import { InjectionMode, asClass, createContainer } from 'awilix';

import AccountApiRepo from './persistence/account-api-repo';
import { GetAccounts } from '../domain/account-api/get-accounts';
import MongoDb from './persistence/db/mongo-db';
import { CreateExpectation } from '../domain/test-suite/create-expectation';
import { CreateJob } from '../domain/test-suite/create-job';
import { CreateTestSuite } from '../domain/test-suite/create-test-suite';
import TestSuiteRepo from './persistence/test-suite-repo';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createExpectation: asClass(CreateExpectation),
  createJob: asClass(CreateJob),
  createTestSuite: asClass(CreateTestSuite),

  getAccounts: asClass(GetAccounts),

  testSuiteRepo: asClass(TestSuiteRepo),

  accountApiRepo: asClass(AccountApiRepo),

  db: asClass(MongoDb),
});

export default iocRegister;
