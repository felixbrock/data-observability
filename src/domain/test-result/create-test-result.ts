// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { TestResult } from '../value-types/test-result';
import { DbConnection } from '../services/i-db';
import { ITestResultRepo } from './i-test-result-repo';
import { TestType } from '../entities/test-suite';

export interface CreateTestResultRequestDto {
  testSuiteId: string;
  testType: TestType;
  threshold: number;
  executionFrequency: number;
  executionId: string;
  isWarmup: boolean;
  testSpecificData?: {
    executedOn: string;
    isAnomolous: boolean;
    modifiedZScore: number;
    deviation: number;
  };
  alertSpecificData?: {
    alertId: string;
  };
  targetResourceId: string;
  targetOrganizationId: string;
}

export type CreateTestResultAuthDto = {
  isSystemInternal: boolean;
};

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
      if (!auth.isSystemInternal) throw new Error('Unauthorized');

      this.#dbConnection = dbConnection;

      const testResult: TestResult = {
        ...request,
        organizationId: request.targetOrganizationId,
      };

      await this.#testResultRepo.insertOne(testResult, this.#dbConnection);

      return Result.ok(testResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
