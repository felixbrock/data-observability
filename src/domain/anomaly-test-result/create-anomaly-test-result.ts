// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { AnomalyTestResult } from '../value-types/anomaly-test-result';
import { DbConnection } from '../services/i-db';
import { IAnomalyTestResultRepo } from './i-anomaly-test-result-repo';

export interface CreateAnomalyTestResultRequestDto {
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
        organizationId: request.targetOrgId,
      };

      await this.#anomalyTestResultRepo.insertOne(anomalyTestResult, this.#dbConnection);

      return Result.ok(anomalyTestResult);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
