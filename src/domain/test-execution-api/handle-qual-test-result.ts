// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { QualTestResult } from '../value-types/qual-test-result';
import { IDbConnection } from '../services/i-db';
import { IQualTestResultRepo } from './i-qual-test-result-repo';
import { TestType } from '../entities/quant-test-suite';
import { QualTestExecutionResultDto } from '../test-execution-api/qual-test-execution-result-dto';
import { ExecuteTestAuthDto } from '../test-execution-api/execute-test';
import { QualTestAlertDto } from '../integration-api/slack/qual-test-alert-dto';
import { SendQualTestSlackAlert } from '../integration-api/slack/send-qual-test-alert';

export interface HandleQualTestResultRequestDto {
  testSuiteId: string;
  testType: TestType;
  executionId: string;
  testData?: {
    executedOn: string;
    isAnomolous: boolean;
    schemaDiffs: any;
  };
  alertData?: {
    alertId: string;
  };
  targetResourceId: string;
  targetOrgId: string;
}

export type HandleQualTestResultAuthDto = null;

export type HandleQualTestResultResponseDto = Result<QualTestResult>;

export class HandleQualTestResult
  implements
    IUseCase<
      HandleQualTestResultRequestDto,
      HandleQualTestResultResponseDto,
      HandleQualTestResultAuthDto,
      IDbConnection
    >
{
  readonly #qualTestResultRepo: IQualTestResultRepo;

  readonly #sendQualTestSlackAlert: SendQualTestSlackAlert;

  #dbConnection: IDbConnection;

  constructor(qualTestResultRepo: IQualTestResultRepo, sendQualTestSlackAlert: SendQualTestSlackAlert) {
    this.#qualTestResultRepo = qualTestResultRepo;
    this.#sendQualTestSlackAlert = sendQualTestSlackAlert;
  }

  #sendAlert = async (
    testExecutionResult: QualTestExecutionResultDto,
    auth: ExecuteTestAuthDto
  ): Promise<void> => {
    if (!testExecutionResult.testData)
      throw new Error('Missing test data. Previous checks indicated test data');
    if (!testExecutionResult.alertData)
      throw new Error(
        'Missing alert data. Previous checks indicated alert data'
      );

    const alertDto: QualTestAlertDto = {
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

    const sendSlackAlertResult = await this.#sendQualTestSlackAlert.execute(
      { alertDto, targetOrgId: testExecutionResult.organizationId },
      { jwt: auth.jwt }
    );

    if (!sendSlackAlertResult.success)
      throw new Error(
        `Sending alert ${testExecutionResult.alertData.alertId} failed`
      );
  };


  #handleQualTestExecutionResult = async (
    testExecutionResult: QualTestExecutionResultDto
  ): Promise<void> => {
    const handleQualTestResultResult = await this.#handleQualTestResult.execute(
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

    if (!handleQualTestResultResult.success)
      throw new Error(handleQualTestResultResult.error);
  };

  async execute(
    request: HandleQualTestResultRequestDto,
    auth: HandleQualTestResultAuthDto,
    dbConnection: IDbConnection
  ): Promise<HandleQualTestResultResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      if (
        !testExecutionResult.testData ||
        (!testExecutionResult.testData.isAnomolous &&
          !testExecutionResult.alertData)
      )
        return Result.ok(testExecutionResult);

      if (!instanceOfQuantTestExecutionResultDto(testExecutionResult))
        await this.#sendQualTestAlert(testExecutionResult, auth);
      else await this.#sendQuantAlert(testExecutionResult, auth);

      const qualTestResult: QualTestResult = {
        ...request,
        organizationId: request.targetOrgId,
      };

      await this.#qualTestResultRepo.insertOne(qualTestResult, this.#dbConnection);

      return Result.ok(qualTestResult);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
