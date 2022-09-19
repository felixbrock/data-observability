// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { SchemaChangeTestResult } from '../value-types/schema-change-test-result';
import { DbConnection } from '../services/i-db';
import { ISchemaChangeTestResultRepo } from './i-schema-change-test-result-repo';
import { TestType } from '../entities/test-suite';

export interface CreateSchemaChangeTestResultRequestDto {
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

export type CreateSchemaChangeTestResultAuthDto = {
  isSystemInternal: boolean;
};

export type CreateSchemaChangeTestResultResponseDto = Result<SchemaChangeTestResult>;

export class CreateSchemaChangeTestResult
  implements
    IUseCase<
      CreateSchemaChangeTestResultRequestDto,
      CreateSchemaChangeTestResultResponseDto,
      CreateSchemaChangeTestResultAuthDto,
      DbConnection
    >
{
  readonly #schemaChangeTestResultRepo: ISchemaChangeTestResultRepo;

  #dbConnection: DbConnection;

  constructor(schemaChangeTestResultRepo: ISchemaChangeTestResultRepo) {
    this.#schemaChangeTestResultRepo = schemaChangeTestResultRepo;
  }

  async execute(
    request: CreateSchemaChangeTestResultRequestDto,
    auth: CreateSchemaChangeTestResultAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateSchemaChangeTestResultResponseDto> {
    try {
      if (!auth.isSystemInternal) throw new Error('Unauthorized');

      this.#dbConnection = dbConnection;

      const schemaChangeTestResult: SchemaChangeTestResult = {
        ...request,
        organizationId: request.targetOrganizationId,
      };

      await this.#schemaChangeTestResultRepo.insertOne(schemaChangeTestResult, this.#dbConnection);

      return Result.ok(schemaChangeTestResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
