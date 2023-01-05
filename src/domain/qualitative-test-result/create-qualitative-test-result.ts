// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { QualTestResult } from '../value-types/qualitative-test-result';
import { IDbConnection } from '../services/i-db';
import { IQualTestResultRepo } from './i-qualitative-test-result-repo';
import { TestType } from '../entities/quantitative-test-suite';
import { QualTestExecutionResultDto } from '../test-execution-api/qualitative-test-execution-result-dto';
import { ExecuteTestAuthDto } from '../test-execution-api/execute-test';
import { QualTestAlertDto } from '../integration-api/slack/qualitative-test-alert-dto';
import { SendQualTestSlackAlert } from '../integration-api/slack/send-qualitative-test-alert';

export interface CreateQualTestTestResultRequestDto {
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

export type CreateQualTestResultAuthDto = null;

export type CreateQualTestResultResponseDto = Result<QualTestResult>;

export class CreateQualTestResult
  implements
    IUseCase<
      CreateQualTestTestResultRequestDto,
      CreateQualTestResultResponseDto,
      CreateQualTestResultAuthDto,
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


  #createQualTestExecutionResult = async (
    testExecutionResult: QualTestExecutionResultDto
  ): Promise<void> => {
    const createQualTestResult = await this.#createQualTestResult.execute(
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

    if (!createQualTestResult.success)
      throw new Error(createQualTestResult.error);
  };

  async execute(
    request: CreateQualTestTestResultRequestDto,
    auth: CreateQualTestResultAuthDto,
    dbConnection: IDbConnection
  ): Promise<CreateQualTestResultResponseDto> {
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
