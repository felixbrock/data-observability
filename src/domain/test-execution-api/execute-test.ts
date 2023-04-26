import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ITestExecutionApiRepo } from './i-test-execution-api-repo';
import { IDb } from '../services/i-db';
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
      IDb
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
      // '{"lastAlertSent": "2023-04-23T11:12:14.0585", "testSuiteId": "f540b96d-2cd0-4424-b3d1-7d62e301acfc", "testType": "ColumnDistribution", "executionId": "be69fc7c-c876-453b-994f-bb02df9cbaa4", "targetResourceId": "dbd1a1de-4eec-423b-8554-45d472585651", "organizationId": "someCustId", "isWarmup": false, "testData": {"executedOn": "2023-04-25T11:11:54.621388", "detectedValue": 5005000, "expectedUpperBound": 466.378624, "expectedLowerBound": 400.62137600000005, "deviation": 0, "anomaly": {"importance": 1.5301944509599927}}, "alertData": {"alertId": "0a291746-3ace-428b-a2e6-80520174bd35", "message": "<__base_url__?targetResourceId=dbd1a1de-4eec-423b-8554-45d472585651&ampisColumn=True|TEST_DB.test_S.TEST_T.SOMENUMBER>", "databaseName": "TEST_DB", "schemaName": "test_S", "materializationName": "TEST_T", "materializationType": "Table", "expectedValue": 567, "columnName": "SOMENUMBER"}}'
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

      let ignoreAlert = false;
      if (testExecutionResult.lastAlertSent) {
        const lastAlertTimestamp = new Date(testExecutionResult.lastAlertSent);
        const now = new Date();
        const timeElapsedMillis = now.getTime() - lastAlertTimestamp.getTime();
        const timeElapsedHrs = timeElapsedMillis / (1000 * 60 * 60);

        if (timeElapsedHrs < 24) {
          testExecutionResult.alertData = undefined;
          ignoreAlert = true;
        }
      }

      if (instanceOfQuantTestExecutionResultDto(testExecutionResult)) {
        if (
          testExecutionResult.testData &&
          testExecutionResult.testData.anomaly &&
          !ignoreAlert &&
          !testExecutionResult.alertData
        )
          throw new Error('Quant test result obj structural mismatch');
        await this.#handleQuantTestExecutionResult.execute({
          req: testExecutionResult,
          auth,
          dbConnection: db.mongoConn,
        });
      } else {
        if (
          testExecutionResult.testData &&
          !testExecutionResult.testData.isIdentical &&
          !ignoreAlert &&
          !testExecutionResult.alertData
        )
          throw new Error('Qual test result obj structural mismatch');
        await this.#handleQualTestExecutionResult.execute({
          req: testExecutionResult,
          auth,
          dbConnection: db.mongoConn,
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
