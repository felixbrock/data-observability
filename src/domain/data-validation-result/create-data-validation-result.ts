// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import {
  DataValidationResult,
  TestEngineResult,
} from '../value-types/data-validation-result';
import { DbConnection } from '../services/i-db';
import { IDataValidationResultRepo } from './i-data-validation-result-repo';

export interface CreateDataValidationResultRequestDto {
  testSuiteId: string;
  testEngineResult: TestEngineResult;
}

export interface CreateDataValidationResultAuthDto {
  organizationId: string;
}

export type CreateDataValidationResultResponseDto =
  Result<DataValidationResult>;

export class CreateDataValidationResult
  implements
    IUseCase<
      CreateDataValidationResultRequestDto,
      CreateDataValidationResultResponseDto,
      CreateDataValidationResultAuthDto,
      DbConnection
    >
{
  readonly #dataValidationResultRepo: IDataValidationResultRepo;

  #dbConnection: DbConnection;

  constructor(dataValidationResultRepo: IDataValidationResultRepo) {
    this.#dataValidationResultRepo = dataValidationResultRepo;
  }

  async execute(
    request: CreateDataValidationResultRequestDto,
    auth: CreateDataValidationResultAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateDataValidationResultResponseDto> {
    console.log(auth);

    try {
      this.#dbConnection = dbConnection;

      const dataValidationResult = DataValidationResult.create({
        testSuiteId: request.testSuiteId,
        testEngineResult: request.testEngineResult,
      });

      await this.#dataValidationResultRepo.insertOne(
        dataValidationResult,
        this.#dbConnection
      );

      // if (auth.organizationId !== 'TODO')
      //   throw new Error('Not authorized to perform action');

      return Result.ok(dataValidationResult);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
