import { TestSuite } from '../entities/quant-test-suite';
import BaseAuth from '../services/base-auth';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import TestSuiteRepo from '../../infrastructure/persistence/test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { ITestSuiteRepo } from './i-test-suite-repo';

export interface ReadTestSuitesRequestDto {
  activated?: boolean;
}

export type ReadTestSuitesAuthDto = BaseAuth;

export type ReadTestSuitesResponseDto = Result<TestSuite[]>;

export class ReadTestSuites
  implements
    IUseCase<
      ReadTestSuitesRequestDto,
      ReadTestSuitesResponseDto,
      ReadTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: ITestSuiteRepo;

  constructor(testSuiteRepo: TestSuiteRepo) {
    this.#repo = testSuiteRepo;
  }

  async execute(props: {
    req: ReadTestSuitesRequestDto;
    auth: ReadTestSuitesAuthDto;
    connPool: IConnectionPool;
  }): Promise<ReadTestSuitesResponseDto> {
    const { req, auth, connPool } = props;

    if (!auth.isSystemInternal && !auth.callerOrgId)
      throw new Error('Not authorized to perform operation');

    try {
      const testSuites = await this.#repo.findBy(
        {
          activated: req.activated,
          deleted: false,
        },
        connPool
      );

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
