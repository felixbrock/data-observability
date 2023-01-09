import Result from '../value-types/transient-types/result';
import { QualTestSuite } from '../entities/qual-test-suite';
import IUseCase from '../services/use-case';
import { IQualTestSuiteRepo } from './i-qual-test-suite-repo';
import QualTestSuiteRepo from '../../infrastructure/persistence/qual-test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export interface ReadQualTestSuiteRequestDto {
  id: string;
}

export type ReadQualTestSuiteAuthDto = null;

export type ReadQualTestSuiteResponseDto = Result<QualTestSuite | null>;

export class ReadQualTestSuite
  implements
    IUseCase<
      ReadQualTestSuiteRequestDto,
      ReadQualTestSuiteResponseDto,
      ReadQualTestSuiteAuthDto,
      IConnectionPool
    >
{
  readonly #repo: IQualTestSuiteRepo;

  constructor(qualTestSuiteRepo: QualTestSuiteRepo) {
    this.#repo = qualTestSuiteRepo;
  }

  async execute(props: {
    req: ReadQualTestSuiteRequestDto;
    connPool: IConnectionPool;
  }): Promise<ReadQualTestSuiteResponseDto> {
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
