// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDbConnection } from '../services/i-db';
import { QuantTestResult } from '../value-types/quant-test-result';
import { IQuantTestResultRepo } from './i-quant-test-result-repo';

export interface CreateQuantTestResultRequestDto {
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

export type CreateQuantTestResultAuthDto = null;

export type CreateQuantTestResultResponseDto = Result<QuantTestResult>;

export class CreateQuantTestResult
  implements
    IUseCase<
      CreateQuantTestResultRequestDto,
      CreateQuantTestResultResponseDto,
      CreateQuantTestResultAuthDto,
      IDbConnection
    >
{
  readonly #quantTestResultRepo: IQuantTestResultRepo;

  #dbConnection: IDbConnection;

  constructor(quantTestResultRepo: IQuantTestResultRepo) {
    this.#quantTestResultRepo = quantTestResultRepo;
  }

  async execute(
    request: CreateQuantTestResultRequestDto,
    auth: CreateQuantTestResultAuthDto,
    dbConnection: IDbConnection
  ): Promise<CreateQuantTestResultResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const quantTestResult: QuantTestResult = {
        ...request,
        organizationId: request.targetOrgId,
      };

      await this.#quantTestResultRepo.insertOne(quantTestResult, this.#dbConnection);

      return Result.ok(quantTestResult);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
