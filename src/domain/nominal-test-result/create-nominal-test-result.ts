// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { NominalTestResult } from '../value-types/nominal-test-result';
import { DbConnection } from '../services/i-db';
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
  targetOrganizationId: string;
}

export type CreateNominalTestResultAuthDto = null;

export type CreateNominalTestResultResponseDto = Result<NominalTestResult>;

export class CreateNominalTestResult
  implements
    IUseCase<
      CreateNominalTestTestResultRequestDto,
      CreateNominalTestResultResponseDto,
      CreateNominalTestResultAuthDto,
      DbConnection
    >
{
  readonly #nominalTestResultRepo: INominalTestResultRepo;

  #dbConnection: DbConnection;

  constructor(nominalTestResultRepo: INominalTestResultRepo) {
    this.#nominalTestResultRepo = nominalTestResultRepo;
  }

  async execute(
    request: CreateNominalTestTestResultRequestDto,
    auth: CreateNominalTestResultAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateNominalTestResultResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const nominalTestResult: NominalTestResult = {
        ...request,
        organizationId: request.targetOrganizationId,
      };

      await this.#nominalTestResultRepo.insertOne(nominalTestResult, this.#dbConnection);

      return Result.ok(nominalTestResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
