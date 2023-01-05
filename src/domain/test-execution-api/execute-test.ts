import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ITestExecutionApiRepo } from './i-test-execution-api-repo';
import { IDbConnection } from '../services/i-db';
import { QualTestExecutionResultDto } from './qualitative-test-execution-result-dto';
import { TestType } from '../entities/quantitative-test-suite';
import { QualTestType } from '../entities/qualitative-test-suite';
import { CustomTestType } from '../entities/custom-test-suite';
import { QuantTestExecutionResultDto } from './quantitative-test-execution-result-dto';

export interface ExecuteTestRequestDto {
  testSuiteId: string;
  testType: TestType | QualTestType | CustomTestType;
  targetOrgId?: string;
}

export interface ExecuteTestAuthDto {
  jwt: string;
}

export type ExecuteTestResponseDto = Result<
  QuantTestExecutionResultDto | QualTestExecutionResultDto
>;

export class ExecuteTest
  implements
    IUseCase<
      ExecuteTestRequestDto,
      ExecuteTestResponseDto,
      ExecuteTestAuthDto,
      IDbConnection
    >
{
  readonly #testExecutionApiRepo: ITestExecutionApiRepo;

  #dbConnection: IDbConnection;

  constructor(
    testExecutionApiRepo: ITestExecutionApiRepo,
  ) {
    this.#testExecutionApiRepo = testExecutionApiRepo;
  }

  async execute(
    request: ExecuteTestRequestDto,
    auth: ExecuteTestAuthDto,
    dbConnection: IDbConnection
  ): Promise<ExecuteTestResponseDto> {
    this.#dbConnection = dbConnection;

    try {
      this.#testExecutionApiRepo.executeTest(
        request.testSuiteId,
        request.testType,
        auth.jwt,
        request.targetOrgId
      );

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
