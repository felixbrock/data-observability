// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { TestResult } from '../value-types/test-result';
import { DbConnection } from '../services/i-db';
import { ITestResultRepo } from './i-test-result-repo';

export interface CreateTestResultRequestDto {
  testSuiteId: string;
  alertId?: string
  testType: string;
  executionId: string;
  executedOn: string;
  isAnomolous: boolean;
  threshold: number;
  executionFrequency: number;
  modifiedZScore: number;
  deviation: number;
  organizationId: string
}

export type CreateTestResultAuthDto = null; 

export type CreateTestResultResponseDto = Result<TestResult>;

export class CreateTestResult
  implements
    IUseCase<
      CreateTestResultRequestDto,
      CreateTestResultResponseDto,
      CreateTestResultAuthDto,
      DbConnection
    >
{
  readonly #testResultRepo: ITestResultRepo;

  #dbConnection: DbConnection;

  constructor(testResultRepo: ITestResultRepo) {
    this.#testResultRepo = testResultRepo;
  }

  async execute(
    request: CreateTestResultRequestDto,
    auth: CreateTestResultAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateTestResultResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const testResult = TestResult.create({
        ...request,
      });

      await this.#testResultRepo.insertOne(testResult, this.#dbConnection);

      // if (auth.organizationId !== 'TODO')
      //   throw new Error('Not authorized to perform action');

      return Result.ok(testResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
