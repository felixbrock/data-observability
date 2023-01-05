// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { QualTestResult } from '../value-types/qual-test-result';
import { IDbConnection } from '../services/i-db';
import { IQualTestResultRepo } from './i-qual-test-result-repo';
import { TestType } from '../entities/quant-test-suite';

export interface CreateQualTestResultRequestDto {
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
