import { InjectionMode, asClass, createContainer } from 'awilix';

import AccountApiRepo from './persistence/account-api-repo';
import { GetAccounts } from '../domain/account-api/get-accounts';
import MongoDb from './persistence/db/mongo-db';
import { CreateExpectation } from '../domain/test-suite/create-expectation';
import { CreateJob } from '../domain/job/create-job';
import { CreateTestSuite } from '../domain/test-suite/create-test-suite';
import TestSuiteRepo from './persistence/test-suite-repo';
import JobRepo from './persistence/job-repo';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createExpectation: asClass(CreateExpectation),
  createJob: asClass(CreateJob),
  createTestSuite: asClass(CreateTestSuite),

  getAccounts: asClass(GetAccounts),

  jobRepo: asClass(JobRepo),
  testSuiteRepo: asClass(TestSuiteRepo),

  accountApiRepo: asClass(AccountApiRepo),

  db: asClass(MongoDb),
});

export default iocRegister;
