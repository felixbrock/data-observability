import { CustomTestSuiteDto } from '../entities/custom-test-suite';
import BaseAuth from '../services/base-auth';

import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import CustomTestSuiteRepo from '../../infrastructure/persistence/custom-test-suite-repo';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export interface ReadCustomTestSuitesRequestDto {
  activated?: boolean;
  executionFrequency?: number;
}

export type ReadCustomTestSuitesAuthDto = BaseAuth;

export type ReadCustomTestSuitesResponseDto = Result<CustomTestSuiteDto[]>;

export class ReadCustomTestSuites
  implements
    IUseCase<
      ReadCustomTestSuitesRequestDto,
      ReadCustomTestSuitesResponseDto,
      ReadCustomTestSuitesAuthDto,
      IConnectionPool
    >
{
  readonly #repo: ICustomTestSuiteRepo;

  constructor(customTestSuiteRepo: CustomTestSuiteRepo) {
    this.#repo = customTestSuiteRepo;
  }

  async execute(
    request: ReadCustomTestSuitesRequestDto,
    auth: ReadCustomTestSuitesAuthDto,
    connPool: IConnectionPool
  ): Promise<ReadCustomTestSuitesResponseDto> {
    if (!auth.isSystemInternal && !auth.callerOrgId)
      throw new Error('Not authorized to perform operation');

    try {
      const testSuites = await this.#repo.findBy(
        {
          activated: request.activated,
          executionFrequency: request.executionFrequency,
        },
        auth,
        connPool
      );

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
