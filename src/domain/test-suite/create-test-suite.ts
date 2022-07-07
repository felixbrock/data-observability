// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { TestSuite, TestType } from '../entities/test-suite';
import { ITestSuiteRepo } from './i-test-suite-repo';
import { DbConnection } from '../services/i-db';
import { Frequency } from '../value-types/job';

export interface CreateTestSuiteRequestDto {
  targetId: string;
  activated: boolean;
  type: TestType;
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

  constructor(
    testSuiteRepo: ITestSuiteRepo
  ) {
    this.#testSuiteRepo = testSuiteRepo;
  }

  async execute(
    request: CreateTestSuiteRequestDto,
    auth: CreateTestSuiteAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateTestSuiteResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const testSuite = TestSuite.create({
        id: new ObjectId().toHexString(),
        activated: request.activated,
        expectationConfiguration: request.expectationConfiguration,
        jobFrequency: request.jobFrequency,
        type: request.type,
        targetId: request.targetId
      });

      await this.#testSuiteRepo.insertOne(testSuite, this.#dbConnection);

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
