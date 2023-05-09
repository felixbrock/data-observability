import QualTestSuiteRepo from '../../infrastructure/persistence/qual-test-suite-repo';
import { QualTestSuite } from '../entities/qual-test-suite';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { IQualTestSuiteRepo } from './i-qual-test-suite-repo';
import { IDbConnection } from '../services/i-db';

export interface ReadQualTestSuitesRequestDto {
  activated?: boolean;
}

export type ReadQualTestSuitesAuthDto = BaseAuth;

export type ReadQualTestSuitesResponseDto = Result<QualTestSuite[]>;

export class ReadQualTestSuites
  implements
    IUseCase<
      ReadQualTestSuitesRequestDto,
      ReadQualTestSuitesResponseDto,
      ReadQualTestSuitesAuthDto,
      IDbConnection
    >
{
  readonly #repo: IQualTestSuiteRepo;

  constructor(qualTestSuiteRepo: QualTestSuiteRepo) {
    this.#repo = qualTestSuiteRepo;
  }

  async execute(props: {
    req: ReadQualTestSuitesRequestDto;
    auth: ReadQualTestSuitesAuthDto;
    dbConnection: IDbConnection;
  }): Promise<ReadQualTestSuitesResponseDto> {
    const { req, auth, dbConnection } = props;

    if (!auth.isSystemInternal && !auth.callerOrgId)
      throw new Error('Not authorized to perform operation');

    try {
      const testSuites = await this.#repo.findBy(
        {
          activated: req.activated,
          deleted: false,
        },
        dbConnection, auth.callerOrgId ? auth.callerOrgId : '',
        true
      ) as QualTestSuite[];

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
