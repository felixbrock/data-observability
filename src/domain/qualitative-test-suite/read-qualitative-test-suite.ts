


import Result from '../value-types/transient-types/result';
import { BaseQualTestSuite} from '../entities/qualitative-test-suite';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import { IQualTestSuiteRepo } from './i-qualitative-test-suite-repo';
import QualTestSuiteRepo from '../../infrastructure/persistence/qualitative-test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export interface ReadQualTestSuiteRequestDto {
  id: string;
}

export type ReadQualTestSuiteAuthDto = BaseAuth;

export type ReadQualTestSuiteResponseDto = Result<BaseQualTestSuite | null>;

export class ReadQualTestSuite implements IUseCase<
  ReadQualTestSuiteRequestDto,
  ReadQualTestSuiteResponseDto,
  ReadQualTestSuiteAuthDto,
  IConnectionPool
> {
  readonly #repo: IQualTestSuiteRepo;

  constructor(qualTestSuiteRepo: QualTestSuiteRepo) {
    this.#repo = qualTestSuiteRepo;
  }

  async execute(
    request: ReadQualTestSuiteRequestDto,
    auth: ReadQualTestSuiteAuthDto,
    connPool: IConnectionPool
  ): Promise<ReadQualTestSuiteResponseDto> {
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
