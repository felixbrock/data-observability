import QualTestSuiteRepo from '../../infrastructure/persistence/qualitative-test-suite-repo';
import { BaseQualTestSuite } from '../entities/qualitative-test-suite';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import Result from '../value-types/transient-types/result';
import { IQualTestSuiteRepo } from './i-qualitative-test-suite-repo';

export interface ReadQualTestSuitesRequestDto {
  activated?: boolean;
}

export type ReadQualTestSuitesAuthDto = BaseAuth;

export type ReadQualTestSuitesResponseDto = Result<BaseQualTestSuite[]>;

export class ReadQualTestSuites
  implements
    IUseCase<
      ReadQualTestSuitesRequestDto,
      ReadQualTestSuitesResponseDto,
      ReadQualTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: IQualTestSuiteRepo;

  constructor(qualTestSuiteRepo: QualTestSuiteRepo) {
    this.#repo = qualTestSuiteRepo;
  }

  async execute(
    request: ReadQualTestSuitesRequestDto,
    auth: ReadQualTestSuitesAuthDto,
    connPool: IConnectionPool
  ): Promise<ReadQualTestSuitesResponseDto> {
    if (!auth.isSystemInternal && !auth.callerOrgId)
      throw new Error('Not authorized to perform operation');

    try {
      const testSuites = await this.#repo.findBy(
        {
          activated: request.activated,
        },
        auth,
        connPool
      );

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
