import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery, { ColumnDefinition } from '../services/cito-data-query';

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
      const nothingToUpdate =
        request.activated === undefined &&
        !request.frequency &&
        !request.cron &&
        !request.threshold &&
        !request.description &&
        !request.name &&
        !request.sqlLogic &&
        !request.targetResourceIds;
      if (nothingToUpdate) return Result.ok(request.id);

      const readQuery = CitoDataQuery.getReadTestSuiteQuery([request.id], 'test_suites_custom');

      const readResult = await this.#querySnowflake.execute(
        { query: readQuery },
        { jwt: auth.jwt }
      );

      if (!readResult.success) throw new Error(readResult.error);

      if (!readResult.value)
        throw new Error(`Error when running snowflake query`);
      if (!readResult.value[Object.keys(readResult.value)[0]].length)
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
      if (request.cron) {
        columnDefinitions.push({ name: 'cron' });
        updateValues.push(request.cron);
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

      const values = [`(${updateValues.join(', ')})`];

      const updateQuery = CitoDataQuery.getUpdateQuery(
        'cito.observability.test_suites_custom',
        columnDefinitions,
        values
      );

      const updateResult = await this.#querySnowflake.execute(
        { query: updateQuery },
        { jwt: auth.jwt }
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
