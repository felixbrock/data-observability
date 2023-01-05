// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { NominalTestResult } from '../value-types/nominal-test-result';
import { IDbConnection } from '../services/i-db';
import { INominalTestResultRepo } from './i-nominal-test-result-repo';
import { TestType } from '../entities/test-suite';

export interface CreateNominalTestTestResultRequestDto {
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

export type CreateNominalTestResultAuthDto = null;

export type CreateNominalTestResultResponseDto = Result<NominalTestResult>;

export class CreateNominalTestResult
  implements
    IUseCase<
      CreateNominalTestTestResultRequestDto,
      CreateNominalTestResultResponseDto,
      CreateNominalTestResultAuthDto,
      IDbConnection
    >
{
  readonly #nominalTestResultRepo: INominalTestResultRepo;

  #dbConnection: IDbConnection;

  constructor(nominalTestResultRepo: INominalTestResultRepo) {
    this.#nominalTestResultRepo = nominalTestResultRepo;
  }

  #sendAlert = async (
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
    request: CreateNominalTestTestResultRequestDto,
    auth: CreateNominalTestResultAuthDto,
    dbConnection: IDbConnection
  ): Promise<CreateNominalTestResultResponseDto> {
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

      const nominalTestResult: NominalTestResult = {
        ...request,
        organizationId: request.targetOrgId,
      };

      await this.#nominalTestResultRepo.insertOne(nominalTestResult, this.#dbConnection);

      return Result.ok(nominalTestResult);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
