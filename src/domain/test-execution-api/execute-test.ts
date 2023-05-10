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
import { HandleCustomTestExecutionResult } from './handle-custom-test-execution-result';
import { CustomTestExecutionResultDto } from './custom-test-execution-result-dto';

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
  QuantTestExecutionResultDto | QualTestExecutionResultDto | CustomTestExecutionResultDto
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

  readonly #handleCustomTestExecutionResult: HandleCustomTestExecutionResult;

  readonly #testExecutionApiRepo: ITestExecutionApiRepo;

  constructor(
    testExecutionApiRepo: ITestExecutionApiRepo,
    handleQuantTestExecutionResult: HandleQuantTestExecutionResult,
    handleQualTestExecutionResult: HandleQualTestExecutionResult,
    handleCustomTestExecutionResult: HandleCustomTestExecutionResult,
  ) {
    this.#testExecutionApiRepo = testExecutionApiRepo;
    this.#handleQuantTestExecutionResult = handleQuantTestExecutionResult;
    this.#handleQualTestExecutionResult = handleQualTestExecutionResult;
    this.#handleCustomTestExecutionResult = handleCustomTestExecutionResult;
  }

  async execute(props: {
    req: ExecuteTestRequestDto;
    auth: ExecuteTestAuthDto;
    db: IDb;
  }): Promise<ExecuteTestResponseDto> {
    const { req, auth, db } = props;

    try {
      // const testExecutionResult = JSON.parse(
      //   '{"testSuiteId": "someCustomTestSuiteId", "testType": "Custom", "executionId": "da93c863-9c04-4dd6-b743-243716dae7af", "organizationId": "631789bf27518f97cf1c82b7", "name": "CustomColumnDistribution", "targetResourceIds": ["randomTRId"], "isWarmup": false, "testData": {"executedOn": "2023-05-05T13:51:08.733361", "detectedValue": 567, "expectedUpperBound": 500.7, "expectedLowerBound": 400.4, "modifiedZScore": null, "deviation": 0.0, "anomaly": {"importance": 0.6610169491525424}}, "alertData": {"alertId": "d490fa81-ecb6-479a-a4f2-781d90cb20e4", "message": "<__base_url__?metric=MEDIAN>", "expectedValue": 567.0}, "lastAlertSent": "2023-05-10T11:51:08.733361"}'
      // );

      const testExecutionResult = await this.#testExecutionApiRepo.executeTest(
        req.testSuiteId,
        req.testType,
        auth.jwt,
        req.targetOrgId
      );

      console.log(`Successfuly executed test ${req.testSuiteId}`);

      console.warn(testExecutionResult);

      const instanceOfCustomTestExecutionResultDto = (
        obj: unknown
      ): obj is CustomTestExecutionResultDto =>
        !!obj && typeof obj === 'object' && 'name' in obj;

      const instanceOfQuantTestExecutionResultDto = (
        obj: unknown
      ): obj is QuantTestExecutionResultDto =>
        !!obj && typeof obj === 'object' && 'isWarmup' in obj;

      if (instanceOfCustomTestExecutionResultDto(testExecutionResult)) {
        if (
          testExecutionResult.testData &&
          testExecutionResult.testData.anomaly &&
          !testExecutionResult.alertData
        )
          throw new Error('Custom test result obj structural mismatch');
        
        await this.#handleCustomTestExecutionResult.execute({
          req: testExecutionResult,
          auth,
          dbConnection: db.mongoConn,
        });
      } else if (instanceOfQuantTestExecutionResultDto(testExecutionResult)) {
        if (
          testExecutionResult.testData &&
          testExecutionResult.testData.anomaly &&
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
