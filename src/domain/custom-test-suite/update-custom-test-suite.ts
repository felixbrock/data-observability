import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import CitoDataQuery, { ColumnDefinition } from '../services/cito-data-query';
import { ExecutionType } from '../value-types/execution-type';
import { GetSnowflakeProfile } from '../integration-api/get-snowflake-profile';
import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';
import GeneralAuth from '../services/general-auth';

export interface UpdateCustomTestSuiteRequestDto {
  id: string;
  activated?: boolean;
  threshold?: number;
  frequency?: number;
  targetResourceIds?: string[];
  name?: string;
  description?: string;
  sqlLogic?: string;
  cron?: string;
  executionType?: ExecutionType;
  profile?: SnowflakeProfileDto;
}

export type UpdateCustomTestSuiteAuthDto = GeneralAuth;

export type UpdateCustomTestSuiteResponseDto = Result<string>;

export class UpdateCustomTestSuite
  implements
    IUseCase<
      UpdateCustomTestSuiteRequestDto,
      UpdateCustomTestSuiteResponseDto,
      UpdateCustomTestSuiteAuthDto
    >
{
  readonly #querySnowflake: QuerySnowflake;

  readonly #getSnowflakeProfile: GetSnowflakeProfile;

  constructor(querySnowflake: QuerySnowflake, getSnowflakeProfile: GetSnowflakeProfile) {
    this.#querySnowflake = querySnowflake;
    this.#getSnowflakeProfile = getSnowflakeProfile;
  }

  #getProfile = async (
    jwt: string,
    targetOrgId?: string
  ): Promise<SnowflakeProfileDto> => {
    const readSnowflakeProfileResult = await this.#getSnowflakeProfile.execute(
      { targetOrgId },
      {
        jwt,
      }
    );

    if (!readSnowflakeProfileResult.success)
      throw new Error(readSnowflakeProfileResult.error);
    if (!readSnowflakeProfileResult.value)
      throw new Error('SnowflakeProfile does not exist');

    return readSnowflakeProfileResult.value;
  };

  async execute(
    request: UpdateCustomTestSuiteRequestDto,
    auth: UpdateCustomTestSuiteAuthDto
  ): Promise<UpdateCustomTestSuiteResponseDto> {
    try {
      const nothingToUpdate =
        request.activated === undefined &&
        !request.frequency &&
        !request.cron &&
        !request.threshold &&
        !request.description &&
        !request.name &&
        !request.sqlLogic &&
        !request.targetResourceIds &&
        !request.executionType;
      if (nothingToUpdate) return Result.ok(request.id);

      const profile = request.profile || (await this.#getProfile(auth.jwt));

      const readQueryText = CitoDataQuery.getReadTestSuiteQuery([request.id], 'test_suites_custom');

      const readResult = await this.#querySnowflake.execute(
        { queryText: readQueryText, binds: [], profile },
        auth
      );

      if (!readResult.success) throw new Error(readResult.error);

      if (!readResult.value)
        throw new Error(`Error when running snowflake query`);
      if (!readResult.value.length)
        throw new Error('Test suite id not found');

      const columnDefinitions: ColumnDefinition[] = [{ name: 'id' }];
      const updateValues: any[] = [`'${request.id}'`];

      if (request.activated !== undefined) {
        columnDefinitions.push({ name: 'activated' });
        updateValues.push(request.activated);
      }
      if (request.frequency) {
        columnDefinitions.push({ name: 'execution_frequency' });
        updateValues.push(request.frequency);
      }
      if (request.threshold) {
        columnDefinitions.push({ name: 'threshold' });
        updateValues.push(request.threshold);
      }
      if (request.description) {
        columnDefinitions.push({ name: 'description' });
        updateValues.push(request.description);
      }
      if (request.name) {
        columnDefinitions.push({ name: 'name' });
        updateValues.push(request.name);
      }
      if (request.sqlLogic) {
        columnDefinitions.push({ name: 'sqlLogic' });
        updateValues.push(request.sqlLogic);
      }
      if (request.targetResourceIds) {
        columnDefinitions.push({ name: 'target_resource_ids' });
        updateValues.push(request.targetResourceIds);
      }
      if (request.cron) {
        columnDefinitions.push({ name: 'cron' });
        updateValues.push(request.cron);
      }
      if(request.executionType) {
        columnDefinitions.push({name: 'execution_type'});
        updateValues.push(request.executionType);
      }

      const values = [`(${updateValues.join(', ')})`];

      const updateQueryText = CitoDataQuery.getUpdateQuery(
        'cito.observability.test_suites_custom',
        columnDefinitions,
        values
      );

      
      const updateResult = await this.#querySnowflake.execute(
        { queryText: updateQueryText, binds: [], profile },
        auth
      );

      if (!updateResult.success) throw new Error(updateResult.error);

      if (!updateResult.value)
        throw new Error(`Updating customTestSuite ${request.id} failed`);

      return Result.ok(request.id);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
