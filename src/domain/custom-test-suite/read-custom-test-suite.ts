import Result from '../value-types/transient-types/result';
import { CustomTestSuiteDto } from '../entities/custom-test-suite';

import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';
import BaseSfQueryUseCase from '../services/base-sf-query-use-case';
import BaseAuth from '../services/base-auth';
import { GetSnowflakeProfile } from '../integration-api/get-snowflake-profile';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';

export interface ReadCustomTestSuiteRequestDto {
  id: string;
  targetOrgId?: string;
  profile?: SnowflakeProfileDto;
}

export type ReadCustomTestSuiteAuthDto = BaseAuth;

export type ReadCustomTestSuiteResponseDto = Result<CustomTestSuiteDto | null>;

export class ReadCustomTestSuite extends BaseSfQueryUseCase<
  ReadCustomTestSuiteRequestDto,
  ReadCustomTestSuiteResponseDto,
  ReadCustomTestSuiteAuthDto
> {
  readonly #repo: ICustomTestSuiteRepo;

  constructor(getProfile: GetSnowflakeProfile, repo: ICustomTestSuiteRepo) {
    super(getProfile);
    this.#repo = repo;
  }

  async execute(
    request: ReadCustomTestSuiteRequestDto,
    auth: ReadCustomTestSuiteAuthDto
  ): Promise<ReadCustomTestSuiteResponseDto> {
    if (auth.isSystemInternal && !request.targetOrgId)
      throw new Error('Target organization id missing');
    if (!auth.isSystemInternal && !auth.callerOrgId)
      throw new Error('Caller organization id missing');
    if (!request.targetOrgId && !auth.callerOrgId)
      throw new Error('No organization Id provided');

    try {
      const profile =
        request.profile ||
        (await this.getProfile(auth.jwt, request.targetOrgId));

      const testSuite = await this.#repo.findOne(
        request.id,
        profile,
        auth,
        request.targetOrgId
      );

      return Result.ok(testSuite);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
