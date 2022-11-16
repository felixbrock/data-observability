import {
  CustomTestSuiteDto,
} from '../entities/custom-test-suite';
import { GetSnowflakeProfile } from '../integration-api/get-snowflake-profile';
import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';
import BaseAuth from '../services/base-auth';
import BaseSfQueryUseCase from '../services/base-sf-query-use-case';

import Result from '../value-types/transient-types/result';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';

export interface ReadCustomTestSuitesRequestDto {
  activated?: boolean;
  executionFrequency?: number;
  profile?: SnowflakeProfileDto;
}

export type ReadCustomTestSuitesAuthDto = BaseAuth;

export type ReadCustomTestSuitesResponseDto = Result<CustomTestSuiteDto[]>;

export class ReadCustomTestSuites extends BaseSfQueryUseCase<
  ReadCustomTestSuitesRequestDto,
  ReadCustomTestSuitesResponseDto,
  ReadCustomTestSuitesAuthDto
> {
  readonly #repo: ICustomTestSuiteRepo;

  constructor(getProfile: GetSnowflakeProfile, repo: ICustomTestSuiteRepo) {
    super(getProfile);
    this.#repo = repo;
  }

  async execute(
    request: ReadCustomTestSuitesRequestDto,
    auth: ReadCustomTestSuitesAuthDto
  ): Promise<ReadCustomTestSuitesResponseDto> {
    if (!auth.isSystemInternal && !auth.callerOrgId)
      throw new Error('Not authorized to perform operation');

    try {
      const profile = request.profile || (await this.getProfile(auth.jwt));

      const testSuites = await this.#repo.findBy(
        {
          activated: request.activated,
          executionFrequency: request.executionFrequency,
        },
        profile,
        auth
      );

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
