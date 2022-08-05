import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ITestExecutionApiRepo } from './i-test-execution-api-repo';
import { TestExecutionResultDto } from './test-execution-result-dto';
import { DbConnection } from '../services/i-db';
import { CreateTestResult } from '../test-result/create-test-result';
import { IIntegrationApiRepo } from '../integration-api/i-integration-api-repo';

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

  readonly #integrationApiRepo: IIntegrationApiRepo;

  readonly #createTestResult: CreateTestResult;

  #dbConnection: DbConnection;

  constructor(
    testExecutionApiRepo: ITestExecutionApiRepo,
    integrationApiRepo: IIntegrationApiRepo,
    createTestResult: CreateTestResult
  ) {
    this.#testExecutionApiRepo = testExecutionApiRepo;
    this.#integrationApiRepo = integrationApiRepo;
    this.#createTestResult = createTestResult;
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

      const sendSlackAlertResult = await this.#integrationApiRepo.sendSlackAlert(
        {
          testType: testExecutionResult.testType,
          detectedOn: testExecutionResult.executedOn,
          deviation: testExecutionResult.deviation,
          expectedLowerBound:
            testExecutionResult.alertSpecificData.expectedLowerBound,
          expectedUpperBound:
            testExecutionResult.alertSpecificData.expectedUpperBound,
          databaseName: testExecutionResult.alertSpecificData.databaseName,
          schemaName: testExecutionResult.alertSpecificData.schemaName,
          materializationName: testExecutionResult.alertSpecificData.materializationName,
          materializationType: testExecutionResult.alertSpecificData.materializationType,
          columnName: testExecutionResult.alertSpecificData.columnName,
          message: testExecutionResult.alertSpecificData.message,
          value: testExecutionResult.alertSpecificData.value,
          organizationId: testExecutionResult.organizationId
        },
        auth.jwt
      );

      if(!sendSlackAlertResult.success)
        throw new Error(`Sending alert ${testExecutionResult.alertSpecificData.alertId} failed`);

      return Result.ok(testExecutionResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
