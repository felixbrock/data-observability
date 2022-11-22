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

  async execute(
    request: CreateNominalTestTestResultRequestDto,
    auth: CreateNominalTestResultAuthDto,
    dbConnection: IDbConnection
  ): Promise<CreateNominalTestResultResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const nominalTestResult: NominalTestResult = {
        ...request,
        organizationId: request.targetOrgId,
      };

      await this.#nominalTestResultRepo.insertOne(nominalTestResult, this.#dbConnection);

      return Result.ok(nominalTestResult);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
