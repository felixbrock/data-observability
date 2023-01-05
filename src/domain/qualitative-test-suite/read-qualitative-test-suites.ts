import QualitativeTestSuiteRepo from '../../infrastructure/persistence/qualitative-test-suite-repo';
import { QualitativeTestSuite } from '../entities/qualitative-test-suite';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import Result from '../value-types/transient-types/result';
import { IQualitativeTestSuiteRepo } from './i-qualitative-test-suite-repo';

export interface ReadQualitativeTestSuitesRequestDto {
  activated?: boolean;
}

export type ReadQualitativeTestSuitesAuthDto = BaseAuth;

export type ReadQualitativeTestSuitesResponseDto = Result<QualitativeTestSuite[]>;

export class ReadQualitativeTestSuites
  implements
    IUseCase<
      ReadQualitativeTestSuitesRequestDto,
      ReadQualitativeTestSuitesResponseDto,
      ReadQualitativeTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: IQualitativeTestSuiteRepo;

  constructor(qualitativeTestSuiteRepo: QualitativeTestSuiteRepo) {
    this.#repo = qualitativeTestSuiteRepo;
  }

  async execute(
    request: ReadQualitativeTestSuitesRequestDto,
    auth: ReadQualitativeTestSuitesAuthDto,
    connPool: IConnectionPool
  ): Promise<ReadQualitativeTestSuitesResponseDto> {
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
