// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDbConnection } from '../services/i-db';
import { SendQuantSlackAlert } from '../integration-api/slack/send-quant-test-alert';
import { QuantTestExecutionResultDto } from '../test-execution-api/quant-test-execution-result-dto';
import { ExecuteTestAuthDto } from '../test-execution-api/execute-test';
import { QuantTestAlertDto } from '../integration-api/slack/quant-test-alert-dto';
import { QuantTestResult } from '../value-types/quant-test-result';
import { IQuantTestResultRepo } from './i-quant-test-result-repo';

export interface CreateQuantTestResultRequestDto {
  testSuiteId: string;
  executionId: string;
  isWarmup: boolean;
  testData?: {
    executedOn: string;
    isAnomolous: boolean;
    modifiedZScore: number;
    deviation: number;
  };
  alertData?: {
    alertId: string;
  };
  targetResourceId: string;
  targetOrgId: string;
}

export type CreateQuantTestResultAuthDto = null;

export type CreateQuantTestResultResponseDto = Result<QuantTestResult>;

export class CreateQuantTestResult
  implements
    IUseCase<
      CreateQuantTestResultRequestDto,
      CreateQuantTestResultResponseDto,
      CreateQuantTestResultAuthDto,
      IDbConnection
    >
{
  readonly #quantTestResultRepo: IQuantTestResultRepo;

  readonly #sendQuantTestSlackAlert: SendQuantSlackAlert;

  #dbConnection: IDbConnection;

  constructor(quantTestResultRepo: IQuantTestResultRepo, sendQuantTestSlackAlert: SendQuantSlackAlert) {
    this.#quantTestResultRepo = quantTestResultRepo;
    this.#sendQuantTestSlackAlert = sendQuantTestSlackAlert;
  }

  #createQuantTestExecutionResult = async (
    testExecutionResult: QuantTestExecutionResultDto
  ): Promise<void> => {
    const { testData } = testExecutionResult;

    if (!testData && !testExecutionResult.isWarmup)
      throw new Error('Test result data misalignment');

    const createQuantTestResultResult = await this.#createQuantTestResult.execute(
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

    if (!createQuantTestResultResult.success)
      throw new Error(createQuantTestResultResult.error);
  };


  #sendAlert = async (
    testExecutionResult: QuantTestExecutionResultDto,
    auth: ExecuteTestAuthDto
  ): Promise<void> => {
    if (!testExecutionResult.testData)
    throw new Error('Missing test data. Previous checks indicated test data');
  if (!testExecutionResult.alertData)
    throw new Error(
      'Missing alert data. Previous checks indicated alert data'
    );

  const alertDto: QuantTestAlertDto = {
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

  const sendSlackAlertResult = await this.#sendQuantTestSlackAlert.execute(
    { alertDto, targetOrgId: testExecutionResult.organizationId },
    { jwt: auth.jwt }
  );

  if (!sendSlackAlertResult.success)
    throw new Error(
      `Sending alert ${testExecutionResult.alertData.alertId} failed`
    );
  };

  async execute(
    request: CreateQuantTestResultRequestDto,
    auth: CreateQuantTestResultAuthDto,
    dbConnection: IDbConnection
  ): Promise<CreateQuantTestResultResponseDto> {
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


      const quantTestResult: QuantTestResult = {
        ...request,
        organizationId: request.targetOrgId,
      };

      await this.#quantTestResultRepo.insertOne(quantTestResult, this.#dbConnection);

      return Result.ok(quantTestResult);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
