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
}

export interface ExecuteTestAuthDto {
  // todo - secure? optional due to organization agnostic cron job requests
  jwt: string;
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
      this.#dbConnection = dbConnection;

      const testExecutionResult = await this.#testExecutionApiRepo.executeTest(
        request.testSuiteId,
        auth.jwt
      );

      if (
        !testExecutionResult.isAnomolous ||
        !testExecutionResult.alertSpecificData
      )
        throw new Error('Anomaly data mismatch');

      const createTestResultResult = await this.#createTestResult.execute(
        {
          alertId: testExecutionResult.alertSpecificData
            ? testExecutionResult.alertSpecificData.alertId
            : undefined,
          deviation: testExecutionResult.deviation,
          executedOn: testExecutionResult.executedOn,
          executionFrequency: testExecutionResult.executionFrequency,
          executionId: testExecutionResult.executionId,
          isAnomolous: testExecutionResult.isAnomolous,
          modifiedZScore: testExecutionResult.modifiedZScore,
          testSuiteId: testExecutionResult.testSuiteId,
          testType: testExecutionResult.testType,
          threshold: testExecutionResult.threshold,
          targetResourceId: testExecutionResult.targetResourceId,
          organizationId: testExecutionResult.organizationId,
        },
        null,
        this.#dbConnection
      );

      if (!createTestResultResult.success)
        throw new Error(createTestResultResult.error);

      if (
        !testExecutionResult.isAnomolous &&
        !testExecutionResult.alertSpecificData
      )
        return Result.ok(testExecutionResult);

      const alertDto: AlertDto = {
        alertId: testExecutionResult.alertSpecificData.alertId,
        testType: testExecutionResult.testType,
        detectedOn: testExecutionResult.executedOn,
        deviation: testExecutionResult.deviation,
        expectedLowerBound:
          testExecutionResult.alertSpecificData.expectedLowerBound,
        expectedUpperBound:
          testExecutionResult.alertSpecificData.expectedUpperBound,
        databaseName: testExecutionResult.alertSpecificData.databaseName,
        schemaName: testExecutionResult.alertSpecificData.schemaName,
        materializationName:
          testExecutionResult.alertSpecificData.materializationName,
        columnName: testExecutionResult.alertSpecificData.columnName,
        message: testExecutionResult.alertSpecificData.message,
        value: testExecutionResult.alertSpecificData.value,
        resourceId: testExecutionResult.targetResourceId,
      };

      const sendSlackAlertResult = await this.#sendSlackAlert.execute(
        { alertDto, targetOrganizationId: testExecutionResult.organizationId },
        { jwt: auth.jwt }
      );

      if (!sendSlackAlertResult.success)
        throw new Error(
          `Sending alert ${testExecutionResult.alertSpecificData.alertId} failed`
        );

      return Result.ok(testExecutionResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
