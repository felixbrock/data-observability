// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { QualTestResult } from '../value-types/qual-test-result';
import { IDbConnection } from '../services/i-db';
import { IQualTestResultRepo } from './i-qual-test-result-repo';
import { TestType } from '../entities/quant-test-suite';
import { SchemaDiff } from '../test-execution-api/qual-test-execution-result-dto';

export interface CreateQualTestResultRequestDto {
  testSuiteId: string;
  testType: TestType;
  executionId: string;
  testData?: {
    executedOn: string;
    isIdentical: boolean;
    deviations: SchemaDiff[];
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
      CreateQualTestResultRequestDto,
      CreateQualTestResultResponseDto,
      CreateQualTestResultAuthDto,
      IDbConnection
    >
{
  readonly #qualTestResultRepo: IQualTestResultRepo;

  #dbConnection: IDbConnection;

  constructor(qualTestResultRepo: IQualTestResultRepo) {
    this.#qualTestResultRepo = qualTestResultRepo;
  }

  async execute(
    request: CreateQualTestResultRequestDto,
    auth: CreateQualTestResultAuthDto,
    dbConnection: IDbConnection
  ): Promise<CreateQualTestResultResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const qualTestResult: QualTestResult = {
        ...request,
        testData: request.testData
          ? {
              ...request.testData,
              deviations: JSON.stringify(request.testData.deviations),
            }
          : undefined,
        organizationId: request.targetOrgId,
      };

      await this.#qualTestResultRepo.insertOne(
        qualTestResult,
        this.#dbConnection
      );

      return Result.ok(qualTestResult);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
