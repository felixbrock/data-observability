import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { TestSuite } from '../entities/quant-test-suite';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { ITestSuiteRepo } from './i-test-suite-repo';
import TestSuiteRepo from '../../infrastructure/persistence/test-suite-repo';

export interface ReadTestSuiteRequestDto {
  id: string;
}

export type ReadTestSuiteAuthDto = null;

export type ReadTestSuiteResponseDto = Result<TestSuite | null>;

export class ReadTestSuite
  implements
    IUseCase<
      ReadTestSuiteRequestDto,
      ReadTestSuiteResponseDto,
      ReadTestSuiteAuthDto,
      IConnectionPool
    >
{
  readonly #repo: ITestSuiteRepo;

  constructor(testSuiteRepo: TestSuiteRepo) {
    this.#repo = testSuiteRepo;
  }

  async execute(props: {
    req: ReadTestSuiteRequestDto;
    connPool: IConnectionPool;
  }): Promise<ReadTestSuiteResponseDto> {
    const { req, connPool } = props;

    try {
      const testSuite = await this.#repo.findOne(req.id, connPool);

      return Result.ok(testSuite);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
