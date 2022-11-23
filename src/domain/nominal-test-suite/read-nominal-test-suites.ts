import NominalTestSuiteRepo from '../../infrastructure/persistence/nominal-test-suite-repo';
import { NominalTestSuite } from '../entities/nominal-test-suite';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import Result from '../value-types/transient-types/result';
import { INominalTestSuiteRepo } from './i-nominal-test-suite-repo';

export interface ReadNominalTestSuitesRequestDto {
  activated?: boolean;
}

export type ReadNominalTestSuitesAuthDto = BaseAuth;

export type ReadNominalTestSuitesResponseDto = Result<NominalTestSuite[]>;

export class ReadNominalTestSuites
  implements
    IUseCase<
      ReadNominalTestSuitesRequestDto,
      ReadNominalTestSuitesResponseDto,
      ReadNominalTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: INominalTestSuiteRepo;

  constructor(nominalTestSuiteRepo: NominalTestSuiteRepo) {
    this.#repo = nominalTestSuiteRepo;
  }

  async execute(
    request: ReadNominalTestSuitesRequestDto,
    auth: ReadNominalTestSuitesAuthDto,
    connPool: IConnectionPool
  ): Promise<ReadNominalTestSuitesResponseDto> {
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
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
