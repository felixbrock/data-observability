import { CustomTestSuite } from '../entities/custom-test-suite';
import BaseAuth from '../services/base-auth';

import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import CustomTestSuiteRepo from '../../infrastructure/persistence/custom-test-suite-repo';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import { IDbConnection } from '../services/i-db';

export interface ReadCustomTestSuitesRequestDto {
  activated?: boolean;
}

export type ReadCustomTestSuitesAuthDto = BaseAuth;

export type ReadCustomTestSuitesResponseDto = Result<CustomTestSuite[]>;

export class ReadCustomTestSuites
  implements
    IUseCase<
      ReadCustomTestSuitesRequestDto,
      ReadCustomTestSuitesResponseDto,
      ReadCustomTestSuitesAuthDto,
      IDbConnection
    >
{
  readonly #repo: ICustomTestSuiteRepo;

  constructor(customTestSuiteRepo: CustomTestSuiteRepo) {
    this.#repo = customTestSuiteRepo;
  }

  async execute(props: {
    req: ReadCustomTestSuitesRequestDto;
    auth: ReadCustomTestSuitesAuthDto;
    dbConnection: IDbConnection;
  }): Promise<ReadCustomTestSuitesResponseDto> {
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
      ) as CustomTestSuite[];

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
