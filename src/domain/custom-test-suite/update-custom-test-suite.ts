import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';

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
}

export interface UpdateCustomTestSuiteAuthDto {
  jwt: string;
}

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

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: UpdateCustomTestSuiteRequestDto,
    auth: UpdateCustomTestSuiteAuthDto
  ): Promise<UpdateCustomTestSuiteResponseDto> {
    try {
      if (
        !request.activated === undefined &&
        !request.frequency &&
        !request.threshold
      )
        return Result.ok(request.id);

      const readQuery = CitoDataQuery.getReadTestSuiteQuery(request.id, true);

      const readResult = await this.#querySnowflake.execute(
        { query: readQuery },
        { jwt: auth.jwt }
      );

      if (!readResult.success) throw new Error(readResult.error);

      if (!readResult.value)
        throw new Error(`Error when running snowflake query`);
      if (!readResult.value[Object.keys(readResult.value)[0]].length)
        throw new Error('Test suite id not found');

      const updateQuery = CitoDataQuery.getUpdateCustomTestSuiteQuery({
        id: request.id,
        activated: request.activated,
        threshold: request.threshold,
        frequency: request.frequency,
        name: request.name,
        description: request.description,
        sqlLogic: request.sqlLogic,
        targetResourceIds: request.targetResourceIds,
        cron: request.cron,
      });

      const updateResult = await this.#querySnowflake.execute(
        { query: updateQuery },
        { jwt: auth.jwt }
      );

      if (!updateResult.success) throw new Error(updateResult.error);

      if (!updateResult.value)
        throw new Error(`Updating customTestSuite ${request.id} failed`);

      // if (customTestSuite.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(request.id);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
