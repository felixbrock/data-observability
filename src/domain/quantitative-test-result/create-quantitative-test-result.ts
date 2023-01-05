// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { QuantitativeTestResult } from '../value-types/quantitative-test-result';
import { IDbConnection } from '../services/i-db';
import { IQuantitativeTestResultRepo } from './i-quantitative-test-result-repo';

export interface CreateQuantitativeTestResultRequestDto {
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

export type CreateQuantitativeTestResultAuthDto = null;

export type CreateQuantitativeTestResultResponseDto = Result<QuantitativeTestResult>;

export class CreateQuantitativeTestResult
  implements
    IUseCase<
      CreateQuantitativeTestResultRequestDto,
      CreateQuantitativeTestResultResponseDto,
      CreateQuantitativeTestResultAuthDto,
      IDbConnection
    >
{
  readonly #quantitativeTestResultRepo: IQuantitativeTestResultRepo;

  #dbConnection: IDbConnection;

  constructor(quantitativeTestResultRepo: IQuantitativeTestResultRepo) {
    this.#quantitativeTestResultRepo = quantitativeTestResultRepo;
  }

  async execute(
    request: CreateQuantitativeTestResultRequestDto,
    auth: CreateQuantitativeTestResultAuthDto,
    dbConnection: IDbConnection
  ): Promise<CreateQuantitativeTestResultResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const quantitativeTestResult: QuantitativeTestResult = {
        ...request,
        organizationId: request.targetOrgId,
      };

      await this.#quantitativeTestResultRepo.insertOne(quantitativeTestResult, this.#dbConnection);

      return Result.ok(quantitativeTestResult);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
