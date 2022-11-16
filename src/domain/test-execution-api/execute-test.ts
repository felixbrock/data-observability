import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ITestExecutionApiRepo } from './i-test-execution-api-repo';
import { AnomalyTestExecutionResultDto } from './anomaly-test-execution-result-dto';
import { DbConnection } from '../services/i-db';
import { CreateAnomalyTestResult } from '../anomaly-test-result/create-anomaly-test-result';
import { CreateNominalTestResult } from '../nominal-test-result/create-nominal-test-result';
import { SendAnomalySlackAlert } from '../integration-api/slack/send-anomaly-alert';
import { AnomalyAlertDto as AnomalyTestAlertDto } from '../integration-api/slack/anomaly-alert-dto';
import { SendNominalTestSlackAlert } from '../integration-api/slack/send-nominal-test-alert';
import { NominalTestAlertDto } from '../integration-api/slack/nominal-test-alert-dto';
import { NominalTestExecutionResultDto } from './nominal-test-execution-result-dto';
import { TestType } from '../entities/test-suite';
import { NominalTestType } from '../entities/nominal-test-suite';
import { CustomTestType } from '../entities/custom-test-suite';

export interface ExecuteTestRequestDto {
  testSuiteId: string;
  testType: TestType | NominalTestType | CustomTestType;
  targetOrgId?: string;
}

export interface ExecuteTestAuthDto {
  jwt: string;
}

export type ExecuteTestResponseDto = Result<
  AnomalyTestExecutionResultDto | NominalTestExecutionResultDto
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

  readonly #createNominalTestResult: CreateNominalTestResult;

  readonly #sendAnomalyTestSlackAlert: SendAnomalySlackAlert;

  readonly #sendNominalTestSlackAlert: SendNominalTestSlackAlert;

  #dbConnection: DbConnection;

  constructor(
    testExecutionApiRepo: ITestExecutionApiRepo,
    createAnomalyTestResult: CreateAnomalyTestResult,
    createNominalTestResult: CreateNominalTestResult,
    sendAnomalySlackAlert: SendAnomalySlackAlert,
    sendNominalTestSlackAlert: SendNominalTestSlackAlert
  ) {
    this.#testExecutionApiRepo = testExecutionApiRepo;
    this.#createAnomalyTestResult = createAnomalyTestResult;
    this.#createNominalTestResult = createNominalTestResult;
    this.#sendAnomalyTestSlackAlert = sendAnomalySlackAlert;
    this.#sendNominalTestSlackAlert = sendNominalTestSlackAlert;
  }

  #createNominalTestExecutionResult = async (
    testExecutionResult: NominalTestExecutionResultDto
  ): Promise<void> => {
    const createTestResultResult = await this.#createNominalTestResult.execute(
      {
        executionId: testExecutionResult.executionId,
        testData: testExecutionResult.testData,
        alertData: testExecutionResult.alertData
          ? { alertId: testExecutionResult.alertData.alertId }
          : undefined,
        testSuiteId: testExecutionResult.testSuiteId,
        testType: testExecutionResult.testType,
        targetResourceId: testExecutionResult.targetResourceId,
        targetOrgId: testExecutionResult.organizationId,
      },
      null,
      this.#dbConnection
    );

    if (!createTestResultResult.success)
      throw new Error(createTestResultResult.error);
  };

  #createAnomalyTestExecutionResult = async (
    testExecutionResult: AnomalyTestExecutionResultDto
  ): Promise<void> => {
    const { testData } = testExecutionResult;

    if (!testData && !testExecutionResult.isWarmup)
      throw new Error('Test result data misalignment');

    const createTestResultResult = await this.#createAnomalyTestResult.execute(
      {
        isWarmup: testExecutionResult.isWarmup,
        executionId: testExecutionResult.executionId,
        testData,
        alertData: testExecutionResult.alertData
          ? { alertId: testExecutionResult.alertData.alertId }
          : undefined,
        testSuiteId: testExecutionResult.testSuiteId,
        targetResourceId: testExecutionResult.targetResourceId,
        targetOrgId: testExecutionResult.organizationId,
      },
      null,
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

    const alertDto: AnomalyTestAlertDto = {
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

    const sendSlackAlertResult = await this.#sendAnomalyTestSlackAlert.execute(
      { alertDto, targetOrgId: testExecutionResult.organizationId },
      { jwt: auth.jwt }
    );

    if (!sendSlackAlertResult.success)
      throw new Error(
        `Sending alert ${testExecutionResult.alertData.alertId} failed`
      );
  };

  #sendNominalTestAlert = async (
    testExecutionResult: NominalTestExecutionResultDto,
    auth: ExecuteTestAuthDto
  ): Promise<void> => {
    if (!testExecutionResult.testData)
      throw new Error('Missing test data. Previous checks indicated test data');
    if (!testExecutionResult.alertData)
      throw new Error(
        'Missing alert data. Previous checks indicated alert data'
      );

    const alertDto: NominalTestAlertDto = {
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

    const sendSlackAlertResult = await this.#sendNominalTestSlackAlert.execute(
      { alertDto, targetOrgId: testExecutionResult.organizationId },
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
    this.#dbConnection = dbConnection;

    try {
      const testExecutionResult = await this.#testExecutionApiRepo.executeTest(
        request.testSuiteId,
        request.testType,
        auth.jwt,
        request.targetOrgId
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
        await this.#createNominalTestExecutionResult(testExecutionResult);
      else await this.#createAnomalyTestExecutionResult(testExecutionResult);

      if (
        !testExecutionResult.testData ||
        (!testExecutionResult.testData.isAnomolous &&
          !testExecutionResult.alertData)
      )
        return Result.ok(testExecutionResult);

      if (!instanceOfAnomalyTestExecutionResultDto(testExecutionResult))
        await this.#sendNominalTestAlert(testExecutionResult, auth);
      else await this.#sendAnomalyAlert(testExecutionResult, auth);

      return Result.ok(testExecutionResult);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
