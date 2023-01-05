import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ITestExecutionApiRepo } from './i-test-execution-api-repo';
import { TestExecutionResultDto } from './test-execution-result-dto';
import { IDbConnection } from '../services/i-db';
import { CreateQuantitativeTestResult } from '../test-result/create-test-result';
import { CreateQualitativeTestResult } from '../qualitative-test-result/create-qualitative-test-result';
import { SendQuantitativeSlackAlert } from '../integration-api/slack/send-quantitative-alert';
import { SendQualitativeTestSlackAlert } from '../integration-api/slack/send-qualitative-test-alert';
import { QualitativeTestAlertDto } from '../integration-api/slack/qualitative-test-alert-dto';
import { QualitativeTestExecutionResultDto } from './qualitative-test-execution-result-dto';
import { TestType } from '../entities/test-suite';
import { QualitativeTestType } from '../entities/qualitative-test-suite';
import { CustomTestType } from '../entities/custom-test-suite';

export interface ExecuteTestRequestDto {
  testSuiteId: string;
  testType: TestType | QualitativeTestType | CustomTestType;
  targetOrgId?: string;
}

export interface ExecuteTestAuthDto {
  jwt: string;
}

export type ExecuteTestResponseDto = Result<
  QuantitativeTestExecutionResultDto | QualitativeTestExecutionResultDto
>;

export class ExecuteTest
  implements
    IUseCase<
      ExecuteTestRequestDto,
      ExecuteTestResponseDto,
      ExecuteTestAuthDto,
      IDbConnection
    >
{
  readonly #testExecutionApiRepo: ITestExecutionApiRepo;

  readonly #createQuantitativeTestResult: CreateQuantitativeTestResult;

  readonly #createQualitativeTestResult: CreateQualitativeTestResult;

  readonly #sendQuantitativeTestSlackAlert: SendQuantitativeSlackAlert;

  readonly #sendQualitativeTestSlackAlert: SendQualitativeTestSlackAlert;

  #dbConnection: IDbConnection;

  constructor(
    testExecutionApiRepo: ITestExecutionApiRepo,
    createQuantitativeTestResult: CreateQuantitativeTestResult,
    createQualitativeTestResult: CreateQualitativeTestResult,
    sendQuantitativeSlackAlert: SendQuantitativeSlackAlert,
    sendQualitativeTestSlackAlert: SendQualitativeTestSlackAlert
  ) {
    this.#testExecutionApiRepo = testExecutionApiRepo;
    this.#createQuantitativeTestResult = createQuantitativeTestResult;
    this.#createQualitativeTestResult = createQualitativeTestResult;
    this.#sendQuantitativeTestSlackAlert = sendQuantitativeSlackAlert;
    this.#sendQualitativeTestSlackAlert = sendQualitativeTestSlackAlert;
  }

  #createQualitativeTestExecutionResult = async (
    testExecutionResult: QualitativeTestExecutionResultDto
  ): Promise<void> => {
    const createTestResultResult = await this.#createQualitativeTestResult.execute(
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

  #createQuantitativeTestExecutionResult = async (
    testExecutionResult: QuantitativeTestExecutionResultDto
  ): Promise<void> => {
    const { testData } = testExecutionResult;

    if (!testData && !testExecutionResult.isWarmup)
      throw new Error('Test result data misalignment');

    const createTestResultResult = await this.#createQuantitativeTestResult.execute(
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

  async execute(
    request: ExecuteTestRequestDto,
    auth: ExecuteTestAuthDto,
    dbConnection: IDbConnection
  ): Promise<ExecuteTestResponseDto> {
    this.#dbConnection = dbConnection;

    try {
      this.#testExecutionApiRepo.executeTest(
        request.testSuiteId,
        request.testType,
        auth.jwt,
        request.targetOrgId
      );

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
