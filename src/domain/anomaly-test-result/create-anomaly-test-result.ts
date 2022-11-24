// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { AnomalyTestResult } from '../value-types/anomaly-test-result';
import { IDbConnection } from '../services/i-db';
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
      IDbConnection
    >
{
  readonly #anomalyTestResultRepo: IAnomalyTestResultRepo;

  #dbConnection: IDbConnection;

  constructor(anomalyTestResultRepo: IAnomalyTestResultRepo) {
    this.#anomalyTestResultRepo = anomalyTestResultRepo;
  }

  async execute(
    request: CreateAnomalyTestResultRequestDto,
    auth: CreateAnomalyTestResultAuthDto,
    dbConnection: IDbConnection
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
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
