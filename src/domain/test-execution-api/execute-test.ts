import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ITestExecutionApiRepo } from './i-test-execution-api-repo';
import { TestExecutionResultDto } from './test-execution-result-dto';
import { DbConnection } from '../services/i-db';
import { CreateTestResult } from '../test-result/create-test-result';
import { SendSlackAlert } from '../integration-api/slack/send-alert';
import { AlertDto } from '../integration-api/slack/alert-dto';

export interface ExecuteTestRequestDto {
  testSuiteId: string;
  targetOrganizationId: string;
}

export interface ExecuteTestAuthDto {
  jwt: string;
  isSystemInternal: boolean;
}

export type ExecuteTestResponseDto = Result<TestExecutionResultDto>;

export class ExecuteTest
  implements
    IUseCase<
      ExecuteTestRequestDto,
      ExecuteTestResponseDto,
      ExecuteTestAuthDto,
      DbConnection
    >
{
  readonly #testExecutionApiRepo: ITestExecutionApiRepo;

  readonly #createTestResult: CreateTestResult;

  readonly #sendSlackAlert: SendSlackAlert;

  #dbConnection: DbConnection;

  constructor(
    testExecutionApiRepo: ITestExecutionApiRepo,
    createTestResult: CreateTestResult,
    sendSlackAlert: SendSlackAlert
  ) {
    this.#testExecutionApiRepo = testExecutionApiRepo;
    this.#createTestResult = createTestResult;
    this.#sendSlackAlert = sendSlackAlert;
  }

  async execute(
    request: ExecuteTestRequestDto,
    auth: ExecuteTestAuthDto,
    dbConnection: DbConnection
  ): Promise<ExecuteTestResponseDto> {
    try {
      if (!auth.isSystemInternal) throw new Error('Unauthorized');

      this.#dbConnection = dbConnection;

      const testExecutionResult = await this.#testExecutionApiRepo.executeTest(
        request.testSuiteId,
        request.targetOrganizationId,
        auth.jwt
      );

      const { testSpecificData, alertSpecificData } = testExecutionResult;

      if (!testSpecificData && !testExecutionResult.isWarmup)
        throw new Error('Test result data misalignment');

      if (
        testSpecificData &&
        testSpecificData.isAnomolous &&
        !alertSpecificData
      )
        throw new Error('Anomaly data mismatch');

      const createTestResultResult = await this.#createTestResult.execute(
        {
          isWarmup: testExecutionResult.isWarmup,
          executionFrequency: testExecutionResult.executionFrequency,
          executionId: testExecutionResult.executionId,
          testSpecificData: testExecutionResult.testSpecificData,
          alertSpecificData: testExecutionResult.alertSpecificData
            ? { alertId: testExecutionResult.alertSpecificData.alertId }
            : undefined,
          testSuiteId: testExecutionResult.testSuiteId,
          testType: testExecutionResult.testType,
          threshold: testExecutionResult.threshold,
          targetResourceId: testExecutionResult.targetResourceId,
          targetOrganizationId: testExecutionResult.organizationId,
        },
        { ...auth },
        this.#dbConnection
      );

      if (!createTestResultResult.success)
        throw new Error(createTestResultResult.error);

      if (
        !testExecutionResult.testSpecificData ||
        (!testExecutionResult.testSpecificData.isAnomolous &&
          !testExecutionResult.alertSpecificData)
      )
        return Result.ok(testExecutionResult);

      if (!testSpecificData)
        throw new Error(
          'Missing test data. Previous checks indicated test data'
        );
      if (!alertSpecificData)
        throw new Error(
          'Missing alert data. Previous checks indicated alert data'
        );

      const alertDto: AlertDto = {
        alertId: alertSpecificData.alertId,
        testType: testExecutionResult.testType,
        detectedOn: testExecutionResult.testSpecificData.executedOn,
        deviation: testExecutionResult.testSpecificData.deviation,
        expectedLowerBound: alertSpecificData.expectedLowerBound,
        expectedUpperBound: alertSpecificData.expectedUpperBound,
        databaseName: alertSpecificData.databaseName,
        schemaName: alertSpecificData.schemaName,
        materializationName: alertSpecificData.materializationName,
        columnName: alertSpecificData.columnName,
        message: alertSpecificData.message,
        value: alertSpecificData.value,
        resourceId: testExecutionResult.targetResourceId,
      };

      const sendSlackAlertResult = await this.#sendSlackAlert.execute(
        { alertDto, targetOrganizationId: testExecutionResult.organizationId },
        { jwt: auth.jwt }
      );

      if (!sendSlackAlertResult.success)
        throw new Error(
          `Sending alert ${alertSpecificData.alertId} failed`
        );

      return Result.ok(testExecutionResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
