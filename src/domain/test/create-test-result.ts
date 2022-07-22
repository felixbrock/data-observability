// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import {
  TestExecution,
  DataValidationResult,
} from '../value-types/test-execution';
import { DbConnection } from '../services/i-db';
import { ITestExecutionRepo } from './i-test-result-repo';

export interface CreateTestExecutionRequestDto {
  testSuiteId: string;
  dataValidationResult: DataValidationResult;
}

export interface CreateTestExecutionAuthDto {
  organizationId: string;
}

export type CreateTestExecutionResponseDto =
  Result<TestExecution>;

export class CreateTestExecution
  implements
    IUseCase<
      CreateTestExecutionRequestDto,
      CreateTestExecutionResponseDto,
      CreateTestExecutionAuthDto,
      DbConnection
    >
{
  readonly #testExecutionRepo: ITestExecutionRepo;

  #dbConnection: DbConnection;

  constructor(testExecutionRepo: ITestExecutionRepo) {
    this.#testExecutionRepo = testExecutionRepo;
  }

  async execute(
    request: CreateTestExecutionRequestDto,
    auth: CreateTestExecutionAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateTestExecutionResponseDto> {
    console.log(auth);

    try {
      this.#dbConnection = dbConnection;

      const testExecution = TestExecution.create({
        testSuiteId: request.testSuiteId,
        dataValidationResult: request.dataValidationResult,
      });

      await this.#testExecutionRepo.insertOne(
        testExecution,
        this.#dbConnection
      );

      // if (auth.organizationId !== 'TODO')
      //   throw new Error('Not authorized to perform action');

      return Result.ok(testExecution);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
