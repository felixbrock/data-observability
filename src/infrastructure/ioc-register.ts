import { InjectionMode, asClass, createContainer } from 'awilix';

import AccountApiRepo from './persistence/account-api-repo';
import { GetAccounts } from '../domain/account-api/get-accounts';
import { CreateExpectation } from '../domain/test-suite/create-expectation';
import { CreateJob } from '../domain/job/create-job';
import { CreateTestSuite } from '../domain/test-suite/create-test-suite';
import TestSuiteRepo from './persistence/test-suite-repo';
import JobRepo from './persistence/job-repo';
import { ReadJobs } from '../domain/job/read-jobs';
import Dbo from './persistence/db/mongo-db';

const iocRegister = createContainer({ injectionMode: InjectionMode.CLASSIC });

iocRegister.register({
  createExpectation: asClass(CreateExpectation),
  createJob: asClass(CreateJob),
  readJobs: asClass(ReadJobs),
  createTestSuite: asClass(CreateTestSuite),

  getAccounts: asClass(GetAccounts),

  jobRepo: asClass(JobRepo),
  testSuiteRepo: asClass(TestSuiteRepo),

  accountApiRepo: asClass(AccountApiRepo),

  dbo: asClass(Dbo).singleton()
});

export default iocRegister;
