import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ITestExecutionApiRepo } from './i-test-execution-api-repo';
import { IDb, IDbConnection } from '../services/i-db';
import { QualTestExecutionResultDto } from './qual-test-execution-result-dto';
import { TestType } from '../entities/quant-test-suite';
import { QualTestType } from '../entities/qual-test-suite';
import { CustomTestType } from '../entities/custom-test-suite';
import { QuantTestExecutionResultDto } from './quant-test-execution-result-dto';
import { HandleQuantTestExecutionResult } from './handle-quant-test-execution-result';
import { HandleQualTestExecutionResult } from './handle-qual-test-execution-result';

export interface ExecuteTestRequestDto {
  testSuiteId: string;
  testType: TestType | QualTestType | CustomTestType;
  targetOrgId?: string;
}

export interface ExecuteTestAuthDto {
  isSystemInternal: boolean;
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
  readonly #handleQuantTestExecutionResult: HandleQuantTestExecutionResult;

  readonly #handleQualTestExecutionResult: HandleQualTestExecutionResult;

  readonly #testExecutionApiRepo: ITestExecutionApiRepo;

  constructor(
    testExecutionApiRepo: ITestExecutionApiRepo,
    handleQuantTestExecutionResult: HandleQuantTestExecutionResult,
    handleQualTestExecutionResult: HandleQualTestExecutionResult
  ) {
    this.#testExecutionApiRepo = testExecutionApiRepo;
    this.#handleQuantTestExecutionResult = handleQuantTestExecutionResult;
    this.#handleQualTestExecutionResult = handleQualTestExecutionResult;
  }

  async execute(props: {
    req: ExecuteTestRequestDto;
    auth: ExecuteTestAuthDto;
    db: IDb;
  }): Promise<ExecuteTestResponseDto> {
    const { req, auth, db } = props;

    try {
      const testExecutionResult = await this.#testExecutionApiRepo.executeTest(
        req.testSuiteId,
        req.testType,
        auth.jwt,
        req.targetOrgId
      );

      console.log(`Successfuly executed test ${req.testSuiteId}`);

      console.warn(testExecutionResult);

      const instanceOfQuantTestExecutionResultDto = (
        obj: unknown
      ): obj is QuantTestExecutionResultDto =>
        !!obj && typeof obj === 'object' && 'isWarmup' in obj;

      if (instanceOfQuantTestExecutionResultDto(testExecutionResult)) {
        if (
          testExecutionResult.testData &&
          testExecutionResult.testData.anomaly &&
          !testExecutionResult.alertData
        )
          throw new Error('Quant test result obj structural mismatch');
        await this.#handleQuantTestExecutionResult.execute({
          req: testExecutionResult,
          auth,
          db,
        });
      } else {
        if (
          testExecutionResult.testData &&
          !testExecutionResult.testData.isIdentical &&
          !testExecutionResult.alertData
        )
          throw new Error('Qual test result obj structural mismatch');
        await this.#handleQualTestExecutionResult.execute({
          req: testExecutionResult,
          auth,
          db,
        });
      }

      return Result.ok(testExecutionResult);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
