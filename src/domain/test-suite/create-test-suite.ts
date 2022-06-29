// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { TestSuite } from '../entities/test-suite';
import { ITestSuiteRepo } from './i-test-suite-repo';
import { DbConnection } from '../services/i-db';
import { CreateExpectation } from './create-expectation';
import { CreateJob } from '../job/create-job';
import { Frequency } from '../entities/job';

export interface CreateTestSuiteRequestDto {
  targetId: string;
  expecationType: string;
  expectationConfiguration: { [key: string]: string | number };
  jobFrequency: Frequency;
}

export interface CreateTestSuiteAuthDto {
  organizationId: string;
}

export type CreateTestSuiteResponseDto = Result<TestSuite>;

export class CreateTestSuite
  implements
    IUseCase<
      CreateTestSuiteRequestDto,
      CreateTestSuiteResponseDto,
      CreateTestSuiteAuthDto,
      DbConnection
    >
{
  readonly #testSuiteRepo: ITestSuiteRepo;

  #dbConnection: DbConnection;

  #createExpectation: CreateExpectation;

  #createJob: CreateJob;

  constructor(
    createExpectation: CreateExpectation,
    createJob: CreateJob,
    testSuiteRepo: ITestSuiteRepo
  ) {
    this.#testSuiteRepo = testSuiteRepo;
    this.#createExpectation = createExpectation;
    this.#createJob = createJob;
  }

  async execute(
    request: CreateTestSuiteRequestDto,
    auth: CreateTestSuiteAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateTestSuiteResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const createExpectationResult = await this.#createExpectation.execute(
        {
          configuration: request.expectationConfiguration,
          type: request.expecationType,
        },
        { organizationId: 'todo' }
      );

      if (!createExpectationResult.success)
        throw new Error(createExpectationResult.error);
      if (!createExpectationResult.value)
        throw new Error('Creating expectation failed');

      const testSuite = TestSuite.create({
        id: new ObjectId().toHexString(),
        expectation: createExpectationResult.value,
        targetId: request.targetId
      });

      await this.#testSuiteRepo.insertOne(testSuite, this.#dbConnection);

      const createJobResult = await this.#createJob.execute(
        {
          frequency: request.jobFrequency,
          testSuiteId: testSuite.id,
        },
        { organizationId: 'todo' },
        this.#dbConnection
      );

      if (!createJobResult.success) throw new Error(createJobResult.error);
      if (!createJobResult.value) throw new Error('Creating job failed');

      // if (auth.organizationId !== 'TODO')
      //   throw new Error('Not authorized to perform action');

      return Result.ok(testSuite);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
