// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { TestResult } from '../value-types/test-result';
import { IDbConnection } from '../services/i-db';
import { ITestResultRepo } from './i-test-result-repo';

export interface CreateTestResultRequestDto {
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

export type CreateTestResultAuthDto = null;

export type CreateTestResultResponseDto = Result<TestResult>;

export class CreateTestResult
  implements
    IUseCase<
      CreateTestResultRequestDto,
      CreateTestResultResponseDto,
      CreateTestResultAuthDto,
      IDbConnection
    >
{
  readonly #testResultRepo: ITestResultRepo;

  #dbConnection: IDbConnection;

  constructor(testResultRepo: ITestResultRepo) {
    this.#testResultRepo = testResultRepo;
  }



  #sendAlert = async (
    testExecutionResult: QuantitativeTestExecutionResultDto,
    auth: ExecuteTestAuthDto
  ): Promise<void> => {
    if (!testExecutionResult.testData)
    throw new Error('Missing test data. Previous checks indicated test data');
  if (!testExecutionResult.alertData)
    throw new Error(
      'Missing alert data. Previous checks indicated alert data'
    );

  const alertDto: QuantitativeTestAlertDto = {
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

  const sendSlackAlertResult = await this.#sendQuantitativeTestSlackAlert.execute(
    { alertDto, targetOrgId: testExecutionResult.organizationId },
    { jwt: auth.jwt }
  );

  if (!sendSlackAlertResult.success)
    throw new Error(
      `Sending alert ${testExecutionResult.alertData.alertId} failed`
    );
  };

  async execute(
    request: CreateTestResultRequestDto,
    auth: CreateTestResultAuthDto,
    dbConnection: IDbConnection
  ): Promise<CreateTestResultResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      if (
        !testExecutionResult.testData ||
        (!testExecutionResult.testData.isAnomolous &&
          !testExecutionResult.alertData)
      )
        return Result.ok(testExecutionResult);

      if (!instanceOfQuantitativeTestExecutionResultDto(testExecutionResult))
        await this.#sendNominalTestAlert(testExecutionResult, auth);
      else await this.#sendQuantitativeAlert(testExecutionResult, auth);


      const testResult: TestResult = {
        ...request,
        organizationId: request.targetOrgId,
      };

      await this.#testResultRepo.insertOne(testResult, this.#dbConnection);

      return Result.ok(testResult);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
