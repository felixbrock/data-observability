import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ITestExecutionApiRepo } from './i-test-execution-api-repo';
import { AnomalyTestExecutionResultDto } from './anomaly-test-execution-result-dto';
import { DbConnection } from '../services/i-db';
import { CreateAnomalyTestResult } from '../anomaly-test-result/create-anomaly-test-result';
import { CreateSchemaChangeTestResult } from '../schema-change-test-result/create-schema-change-test-result';
import { SendAnomalySlackAlert } from '../integration-api/slack/send-anomaly-alert';
import { AnomalyAlertDto } from '../integration-api/slack/anomaly-alert-dto';
import { SendSchemaChangeSlackAlert } from '../integration-api/slack/send-schema-change-alert';
import { SchemaChangeAlertDto } from '../integration-api/slack/schema-change-alert-dto';
import { SchemaChangeTestExecutionResultDto } from './schema-change-test-execution-result-dto';

export interface ExecuteTestRequestDto {
  testSuiteId: string;
  targetOrganizationId: string;
}

export interface ExecuteTestAuthDto {
  jwt: string;
  isSystemInternal: boolean;
}

export type ExecuteTestResponseDto = Result<
  AnomalyTestExecutionResultDto | SchemaChangeTestExecutionResultDto
>;

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

  readonly #createAnomalyTestResult: CreateAnomalyTestResult;

  readonly #createSchemaChangeTestResult: CreateSchemaChangeTestResult;

  readonly #sendAnomalySlackAlert: SendAnomalySlackAlert;

  readonly #sendSchemaChangeSlackAlert: SendSchemaChangeSlackAlert;

  #dbConnection: DbConnection;

  constructor(
    testExecutionApiRepo: ITestExecutionApiRepo,
    createAnomalyTestResult: CreateAnomalyTestResult,
    createSchemaChangeTestResult: CreateSchemaChangeTestResult,
    sendAnomalySlackAlert: SendAnomalySlackAlert,
    sendSchemaChangeSlackAlert: SendSchemaChangeSlackAlert
  ) {
    this.#testExecutionApiRepo = testExecutionApiRepo;
    this.#createAnomalyTestResult = createAnomalyTestResult;
    this.#createSchemaChangeTestResult = createSchemaChangeTestResult;
    this.#sendAnomalySlackAlert = sendAnomalySlackAlert;
    this.#sendSchemaChangeSlackAlert = sendSchemaChangeSlackAlert;
  }

  #createSchemaChangeTestExecutionResult = async (
    testExecutionResult: SchemaChangeTestExecutionResultDto,
    auth: ExecuteTestAuthDto
  ): Promise<void> => {
    const createTestResultResult =
      await this.#createSchemaChangeTestResult.execute(
        {
          executionId: testExecutionResult.executionId,
          testData: testExecutionResult.testData,
          alertData: testExecutionResult.alertData
            ? { alertId: testExecutionResult.alertData.alertId }
            : undefined,
          testSuiteId: testExecutionResult.testSuiteId,
          testType: testExecutionResult.testType,
          targetResourceId: testExecutionResult.targetResourceId,
          targetOrganizationId: testExecutionResult.organizationId,
        },
        { ...auth },
        this.#dbConnection
      );

    if (!createTestResultResult.success)
      throw new Error(createTestResultResult.error);
  };

  #createAnomalyTestExecutionResult = async (
    testExecutionResult: AnomalyTestExecutionResultDto,
    auth: ExecuteTestAuthDto
  ): Promise<void> => {
    const { testData } = testExecutionResult;

    if (!testData && !testExecutionResult.isWarmup)
      throw new Error('Test result data misalignment');

    const createTestResultResult = await this.#createAnomalyTestResult.execute(
      {
        isWarmup: testExecutionResult.isWarmup,
        executionFrequency: testExecutionResult.executionFrequency,
        executionId: testExecutionResult.executionId,
        testData,
        alertData: testExecutionResult.alertData
          ? { alertId: testExecutionResult.alertData.alertId }
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
  };

  #sendAnomalyAlert = async (
    testExecutionResult: AnomalyTestExecutionResultDto,
    auth: ExecuteTestAuthDto
  ): Promise<void> => {
    if (!testExecutionResult.testData)
      throw new Error('Missing test data. Previous checks indicated test data');
    if (!testExecutionResult.alertData)
      throw new Error(
        'Missing alert data. Previous checks indicated alert data'
      );

    const alertDto: AnomalyAlertDto = {
      alertId: testExecutionResult.alertData.alertId,
      testType: testExecutionResult.testType,
      detectedOn: testExecutionResult.testData.executedOn,
      deviation: testExecutionResult.testData.deviation,
      expectedLowerBound: testExecutionResult.alertData.expectedLowerBound,
      expectedUpperBound: testExecutionResult.alertData.expectedUpperBound,
      databaseName: testExecutionResult.alertData.databaseName,
      schemaName: testExecutionResult.alertData.schemaName,
      materializationName: testExecutionResult.alertData.materializationName,
      columnName: testExecutionResult.alertData.columnName,
      message: testExecutionResult.alertData.message,
      value: testExecutionResult.alertData.value,
      resourceId: testExecutionResult.targetResourceId,
    };

    const sendSlackAlertResult = await this.#sendAnomalySlackAlert.execute(
      { alertDto, targetOrganizationId: testExecutionResult.organizationId },
      { jwt: auth.jwt }
    );

    if (!sendSlackAlertResult.success)
      throw new Error(
        `Sending alert ${testExecutionResult.alertData.alertId} failed`
      );
  };

  #sendSchemaChangeAlert = async (
    testExecutionResult: SchemaChangeTestExecutionResultDto,
    auth: ExecuteTestAuthDto
  ): Promise<void> => {
    if (!testExecutionResult.testData)
      throw new Error('Missing test data. Previous checks indicated test data');
    if (!testExecutionResult.alertData)
      throw new Error(
        'Missing alert data. Previous checks indicated alert data'
      );

    const alertDto: SchemaChangeAlertDto = {
      alertId: testExecutionResult.alertData.alertId,
      testType: testExecutionResult.testType,
      detectedOn: testExecutionResult.testData.executedOn,
      databaseName: testExecutionResult.alertData.databaseName,
      schemaName: testExecutionResult.alertData.schemaName,
      materializationName: testExecutionResult.alertData.materializationName,
      message: testExecutionResult.alertData.message,
      resourceId: testExecutionResult.targetResourceId,
      schemaDiffs: testExecutionResult.testData.schemaDiffs,
    };

    const sendSlackAlertResult = await this.#sendSchemaChangeSlackAlert.execute(
      { alertDto, targetOrganizationId: testExecutionResult.organizationId },
      { jwt: auth.jwt }
    );

    if (!sendSlackAlertResult.success)
      throw new Error(
        `Sending alert ${testExecutionResult.alertData.alertId} failed`
      );
  };

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

      if (
        testExecutionResult.testData &&
        testExecutionResult.testData.isAnomolous &&
        !testExecutionResult.alertData
      )
        throw new Error('Anomaly data mismatch');

      const instanceOfAnomalyTestExecutionResultDto = (
        object: any
      ): object is AnomalyTestExecutionResultDto => 'isWarmup' in object;
      if (!instanceOfAnomalyTestExecutionResultDto(testExecutionResult))
        await this.#createSchemaChangeTestExecutionResult(
          testExecutionResult,
          auth
        );
      else
        await this.#createAnomalyTestExecutionResult(testExecutionResult, auth);

      if (
        !testExecutionResult.testData ||
        (!testExecutionResult.testData.isAnomolous &&
          !testExecutionResult.alertData)
      )
        return Result.ok(testExecutionResult);

      if (!instanceOfAnomalyTestExecutionResultDto(testExecutionResult))
        await this.#sendSchemaChangeAlert(testExecutionResult, auth);
      else await this.#sendAnomalyAlert(testExecutionResult, auth);

      return Result.ok(testExecutionResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
