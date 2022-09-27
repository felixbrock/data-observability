// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { AnomalyTestResult } from '../value-types/anomaly-test-result';
import { DbConnection } from '../services/i-db';
import { IAnomalyTestResultRepo } from './i-anomaly-test-result-repo';
import { TestType } from '../entities/test-suite';

export interface CreateAnomalyTestResultRequestDto {
  testSuiteId: string;
  testType: TestType;
  threshold: number;
  executionFrequency: number;
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
  targetOrganizationId: string;
}

export type CreateAnomalyTestResultAuthDto = null;

export type CreateAnomalyTestResultResponseDto = Result<AnomalyTestResult>;

export class CreateAnomalyTestResult
  implements
    IUseCase<
      CreateAnomalyTestResultRequestDto,
      CreateAnomalyTestResultResponseDto,
      CreateAnomalyTestResultAuthDto,
      DbConnection
    >
{
  readonly #anomalyTestResultRepo: IAnomalyTestResultRepo;

  #dbConnection: DbConnection;

  constructor(anomalyTestResultRepo: IAnomalyTestResultRepo) {
    this.#anomalyTestResultRepo = anomalyTestResultRepo;
  }

  async execute(
    request: CreateAnomalyTestResultRequestDto,
    auth: CreateAnomalyTestResultAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateAnomalyTestResultResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const anomalyTestResult: AnomalyTestResult = {
        ...request,
        organizationId: request.targetOrganizationId,
      };

      await this.#anomalyTestResultRepo.insertOne(anomalyTestResult, this.#dbConnection);

      return Result.ok(anomalyTestResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
