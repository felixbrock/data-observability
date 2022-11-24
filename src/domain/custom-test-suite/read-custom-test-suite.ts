import Result from '../value-types/transient-types/result';
import { CustomTestSuiteDto } from '../entities/custom-test-suite';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import CustomTestSuiteRepo from '../../infrastructure/persistence/custom-test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export interface ReadCustomTestSuiteRequestDto {
  id: string;
}

export type ReadCustomTestSuiteAuthDto = BaseAuth;

export type ReadCustomTestSuiteResponseDto = Result<CustomTestSuiteDto | null>;

export class ReadCustomTestSuite
  implements
    IUseCase<
      ReadCustomTestSuiteRequestDto,
      ReadCustomTestSuiteResponseDto,
      ReadCustomTestSuiteAuthDto,
      IConnectionPool
    >
{
  readonly #repo: ICustomTestSuiteRepo;

  constructor(customTestSuiteRepo: CustomTestSuiteRepo) {
    this.#repo = customTestSuiteRepo;
  }

  async execute(
    request: ReadCustomTestSuiteRequestDto,
    auth: ReadCustomTestSuiteAuthDto,
    connPool: IConnectionPool
  ): Promise<ReadCustomTestSuiteResponseDto> {
    try {
      const testSuite = await this.#repo.findOne(request.id, auth, connPool);

      return Result.ok(testSuite);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
