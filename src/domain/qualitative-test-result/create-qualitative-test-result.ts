// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { QualitativeTestResult } from '../value-types/qualitative-test-result';
import { IDbConnection } from '../services/i-db';
import { IQualitativeTestResultRepo } from './i-qualitative-test-result-repo';
import { TestType } from '../entities/test-suite';

export interface CreateQualitativeTestTestResultRequestDto {
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

export type CreateQualitativeTestResultAuthDto = null;

export type CreateQualitativeTestResultResponseDto = Result<QualitativeTestResult>;

export class CreateQualitativeTestResult
  implements
    IUseCase<
      CreateQualitativeTestTestResultRequestDto,
      CreateQualitativeTestResultResponseDto,
      CreateQualitativeTestResultAuthDto,
      IDbConnection
    >
{
  readonly #qualitativeTestResultRepo: IQualitativeTestResultRepo;

  #dbConnection: IDbConnection;

  constructor(qualitativeTestResultRepo: IQualitativeTestResultRepo) {
    this.#qualitativeTestResultRepo = qualitativeTestResultRepo;
  }

  #sendAlert = async (
    testExecutionResult: QualitativeTestExecutionResultDto,
    auth: ExecuteTestAuthDto
  ): Promise<void> => {
    if (!testExecutionResult.testData)
      throw new Error('Missing test data. Previous checks indicated test data');
    if (!testExecutionResult.alertData)
      throw new Error(
        'Missing alert data. Previous checks indicated alert data'
      );

    const alertDto: QualitativeTestAlertDto = {
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

    const sendSlackAlertResult = await this.#sendQualitativeTestSlackAlert.execute(
      { alertDto, targetOrgId: testExecutionResult.organizationId },
      { jwt: auth.jwt }
    );

    if (!sendSlackAlertResult.success)
      throw new Error(
        `Sending alert ${testExecutionResult.alertData.alertId} failed`
      );
  };

  async execute(
    request: CreateQualitativeTestTestResultRequestDto,
    auth: CreateQualitativeTestResultAuthDto,
    dbConnection: IDbConnection
  ): Promise<CreateQualitativeTestResultResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      if (
        !testExecutionResult.testData ||
        (!testExecutionResult.testData.isAnomolous &&
          !testExecutionResult.alertData)
      )
        return Result.ok(testExecutionResult);

      if (!instanceOfQuantitativeTestExecutionResultDto(testExecutionResult))
        await this.#sendQualitativeTestAlert(testExecutionResult, auth);
      else await this.#sendQuantitativeAlert(testExecutionResult, auth);

      const qualitativeTestResult: QualitativeTestResult = {
        ...request,
        organizationId: request.targetOrgId,
      };

      await this.#qualitativeTestResultRepo.insertOne(qualitativeTestResult, this.#dbConnection);

      return Result.ok(qualitativeTestResult);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
