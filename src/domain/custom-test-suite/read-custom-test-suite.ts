import Result from '../value-types/transient-types/result';
import { CustomTestSuiteDto } from '../entities/custom-test-suite';
import IUseCase from '../services/use-case';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import CustomTestSuiteRepo from '../../infrastructure/persistence/custom-test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export interface ReadCustomTestSuiteRequestDto {
  id: string;
}

export type ReadCustomTestSuiteAuthDto = null;

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

  async execute(props: {
    req: ReadCustomTestSuiteRequestDto;
    connPool: IConnectionPool;
  }): Promise<ReadCustomTestSuiteResponseDto> {
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
