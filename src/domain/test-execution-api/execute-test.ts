import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ITestExecutionApiRepo } from './i-test-execution-api-repo';
import { TestExecutionResultDto } from './test-execution-result-dto';
import { IDbConnection } from '../services/i-db';
import { CreateQuantitativeTestResult } from '../test-result/create-test-result';
import { CreateNominalTestResult } from '../nominal-test-result/create-nominal-test-result';
import { SendQuantitativeSlackAlert } from '../integration-api/slack/send-quantitative-alert';
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
  QuantitativeTestExecutionResultDto | NominalTestExecutionResultDto
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

  readonly #createNominalTestResult: CreateNominalTestResult;

  readonly #sendQuantitativeTestSlackAlert: SendQuantitativeSlackAlert;

  readonly #sendNominalTestSlackAlert: SendNominalTestSlackAlert;

  #dbConnection: IDbConnection;

  constructor(
    testExecutionApiRepo: ITestExecutionApiRepo,
    createQuantitativeTestResult: CreateQuantitativeTestResult,
    createNominalTestResult: CreateNominalTestResult,
    sendQuantitativeSlackAlert: SendQuantitativeSlackAlert,
    sendNominalTestSlackAlert: SendNominalTestSlackAlert
  ) {
    this.#testExecutionApiRepo = testExecutionApiRepo;
    this.#createQuantitativeTestResult = createQuantitativeTestResult;
    this.#createNominalTestResult = createNominalTestResult;
    this.#sendQuantitativeTestSlackAlert = sendQuantitativeSlackAlert;
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
