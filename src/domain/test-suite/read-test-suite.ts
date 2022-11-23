import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { TestSuite } from '../entities/test-suite';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { ITestSuiteRepo } from './i-test-suite-repo';
import TestSuiteRepo from '../../infrastructure/persistence/test-suite-repo';

export interface ReadTestSuiteRequestDto {
  id: string;
}

export interface ReadTestSuiteAuthDto {
  jwt: string;
  callerOrgId?: string;
  isSystemInternal: boolean;
}

export type ReadTestSuiteResponseDto = Result<TestSuite|null>;

export class ReadTestSuite
  implements
    IUseCase<
      ReadTestSuiteRequestDto,
      ReadTestSuiteResponseDto,
      ReadTestSuiteAuthDto,
      IConnectionPool
    >
{

  readonly #repo:  ITestSuiteRepo;

  constructor(
    testSuiteRepo: TestSuiteRepo
  ) {
    this.#repo = testSuiteRepo;
  }

  async execute(
    req: ReadTestSuiteRequestDto,
    auth: ReadTestSuiteAuthDto, 
    connPool: IConnectionPool
  ): Promise<ReadTestSuiteResponseDto> {
    try {
      const testSuite = await this.#repo.findOne(
        req.id,
        auth,
        connPool,
      );

      return Result.ok(testSuite);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
