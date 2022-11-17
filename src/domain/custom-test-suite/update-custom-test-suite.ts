import Result from '../value-types/transient-types/result';

import { ExecutionType } from '../value-types/execution-type';
import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';
import BaseAuth from '../services/base-auth';
import BaseSfQueryUseCase from '../services/base-sf-query-use-case';
import { ICustomTestSuiteRepo } from '../services/i-base-service-repo';
import { GetSnowflakeProfile } from '../integration-api/get-snowflake-profile';

export interface UpdateCustomTestSuiteRequestDto {
  id: string;
  props?: {
    activated?: boolean;
    threshold?: number;
    frequency?: number;
    targetResourceIds?: string[];
    name?: string;
    description?: string;
    sqlLogic?: string;
    cron?: string;
    executionType?: ExecutionType;
  };
  profile?: SnowflakeProfileDto;
}

export type UpdateCustomTestSuiteAuthDto = BaseAuth;

export type UpdateCustomTestSuiteResponseDto = Result<string>;

export class UpdateCustomTestSuite extends BaseSfQueryUseCase<
  UpdateCustomTestSuiteRequestDto,
  UpdateCustomTestSuiteResponseDto,
  UpdateCustomTestSuiteAuthDto
> {
  readonly #repo: ICustomTestSuiteRepo;

  constructor(getProfile: GetSnowflakeProfile, repo: ICustomTestSuiteRepo) {
    super(getProfile);
    this.#repo = repo;
  }

  async execute(
    request: UpdateCustomTestSuiteRequestDto,
    auth: UpdateCustomTestSuiteAuthDto
  ): Promise<UpdateCustomTestSuiteResponseDto> {
    try {
      if (!request.props) return Result.ok(request.id);

      const profile = request.profile || (await this.getProfile(auth.jwt));

      const testSuite = await this.#repo.findOne(request.id, profile, auth);

      if (!testSuite) throw new Error('Test suite not found');

      const updateResult = await this.#repo.updateOne(
        request.id,
        request.props,
        profile,
        auth
      );

      return Result.ok(updateResult);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
