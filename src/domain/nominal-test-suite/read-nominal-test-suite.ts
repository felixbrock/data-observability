


import Result from '../value-types/transient-types/result';
import { NominalTestSuite} from '../entities/nominal-test-suite';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import { INominalTestSuiteRepo } from './i-nominal-test-suite-repo';
import NominalTestSuiteRepo from '../../infrastructure/persistence/nominal-test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export interface ReadNominalTestSuiteRequestDto {
  id: string;
}

export type ReadNominalTestSuiteAuthDto = BaseAuth;

export type ReadNominalTestSuiteResponseDto = Result<NominalTestSuite | null>;

export class ReadNominalTestSuite implements IUseCase<
  ReadNominalTestSuiteRequestDto,
  ReadNominalTestSuiteResponseDto,
  ReadNominalTestSuiteAuthDto,
  IConnectionPool
> {
  readonly #repo: INominalTestSuiteRepo;

  constructor(nominalTestSuiteRepo: NominalTestSuiteRepo) {
    this.#repo = nominalTestSuiteRepo;
  }

  async execute(
    request: ReadNominalTestSuiteRequestDto,
    auth: ReadNominalTestSuiteAuthDto,
    connPool: IConnectionPool
  ): Promise<ReadNominalTestSuiteResponseDto> {
    try {
      const testSuite = await this.#repo.findOne(
        request.id,
        auth,
        connPool,
      );

      return Result.ok(testSuite);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
