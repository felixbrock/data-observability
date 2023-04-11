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
      // const testExecutionResult = JSON.parse(
      //   '{"testSuiteId": "f540b96d-2cd0-4424-b3d1-7d62e301acfc", "testType": "ColumnDistribution", "executionId": "bc817074-d266-4479-bc75-5a67e45ca534", "targetResourceId": "646bc8d9-cd15-42d0-85cb-87afd0440dc4", "organizationId": "631789bf27518f97cf1c82b7", "isWarmup": false, "testData": {"executedOn": "2023-04-03T10:02:16.625197", "detectedValue": 5005000, "expectedUpperBound": 1466.378624, "expectedLowerBound": 423.62137600000005, "modifiedZScore": 57586.42302911138, "deviation": 5022.126231317975, "anomaly": {"importance": 4798.368585759282}}, "alertData": {"alertId": "887ee5e0-edb9-46e1-95fd-3a8e278484fb", "message": "<__base_url__?targetResourceId=646bc8d9-cd15-42d0-85cb-87afd0440dc4&ampisColumn=True|TEST_DB.test_S.TEST_T.SOMENUMBER>", "databaseName": "TEST_DB", "schemaName": "test_S", "materializationName": "TEST_T", "materializationType": "Table", "expectedValue": 945.0, "columnName": "SOMENUMBER"}}'
      // );

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

      if (testExecutionResult.lastAlertSent) {
        const lastAlertTimestamp = new Date(testExecutionResult.lastAlertSent);
        const now = new Date();
        const timeElapsedMillis = now.getTime() - lastAlertTimestamp.getTime();
        const timeElapsedHrs = timeElapsedMillis / (1000 * 60 * 60);

        if (timeElapsedHrs < 24) {
          testExecutionResult.alertData = undefined;
          return Result.ok(testExecutionResult);
        }
      }

      return Result.ok(testExecutionResult);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
