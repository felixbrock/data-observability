


import Result from '../value-types/transient-types/result';
import { QualitativeTestSuite} from '../entities/qualitative-test-suite';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import { IQualitativeTestSuiteRepo } from './i-qualitative-test-suite-repo';
import QualitativeTestSuiteRepo from '../../infrastructure/persistence/qualitative-test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export interface ReadQualitativeTestSuiteRequestDto {
  id: string;
}

export type ReadQualitativeTestSuiteAuthDto = BaseAuth;

export type ReadQualitativeTestSuiteResponseDto = Result<QualitativeTestSuite | null>;

export class ReadQualitativeTestSuite implements IUseCase<
  ReadQualitativeTestSuiteRequestDto,
  ReadQualitativeTestSuiteResponseDto,
  ReadQualitativeTestSuiteAuthDto,
  IConnectionPool
> {
  readonly #repo: IQualitativeTestSuiteRepo;

  constructor(qualitativeTestSuiteRepo: QualitativeTestSuiteRepo) {
    this.#repo = qualitativeTestSuiteRepo;
  }

  async execute(
    request: ReadQualitativeTestSuiteRequestDto,
    auth: ReadQualitativeTestSuiteAuthDto,
    connPool: IConnectionPool
  ): Promise<ReadQualitativeTestSuiteResponseDto> {
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
