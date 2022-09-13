import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery, { ColumnDefinition } from '../services/cito-data-query';
import { SnowflakeQueryResultDto } from '../integration-api/snowflake/snowlake-query-result-dto';

interface UpdateObject {
  id: string;
  activated?: boolean;
  threshold?: number;
  frequency?: number;
  cron?: string;
}

export interface UpdateTestSuitesRequestDto {
  updateObjects: UpdateObject[];
}

export interface UpdateTestSuitesAuthDto {
  callerOrganizationId: string;
  jwt: string;
}

export type UpdateTestSuitesResponseDto = Result<SnowflakeQueryResultDto>;

export class UpdateTestSuites
  implements
    IUseCase<
      UpdateTestSuitesRequestDto,
      UpdateTestSuitesResponseDto,
      UpdateTestSuitesAuthDto
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: UpdateTestSuitesRequestDto,
    auth: UpdateTestSuitesAuthDto
  ): Promise<UpdateTestSuitesResponseDto> {
    try {
      const nothingToUpdate =
        request.updateObjects[0].activated === undefined &&
        !request.updateObjects[0].frequency &&
        !request.updateObjects[0].cron &&
        !request.updateObjects[0].threshold;
      if (!request.updateObjects.length || nothingToUpdate) return Result.ok();

      const readQuery = CitoDataQuery.getReadTestSuiteQuery(
        request.updateObjects.map((el) => el.id),
        false
      );

      const readResult = await this.#querySnowflake.execute(
        { query: readQuery },
        { jwt: auth.jwt }
      );

      if (!readResult.success) throw new Error(readResult.error);

      const testSuites = readResult.value;

      if (!testSuites) throw new Error(`Error when running snowflake query`);
      if (!testSuites[Object.keys(testSuites)[0]].length)
        throw new Error('Test suites not found');
      if (
        testSuites[Object.keys(testSuites)[0]].length !==
        request.updateObjects.length
      )
        throw new Error(
          'Difference between number of test suites to be updated and found test suites'
        );

      const columnDefinitions: ColumnDefinition[] = [{ name: 'id' }];
      if (request.updateObjects[0].activated !== undefined)
        columnDefinitions.push({ name: 'activated' });
      if (request.updateObjects[0].frequency)
        columnDefinitions.push({ name: 'execution_frequency' });
      if (request.updateObjects[0].threshold)
        columnDefinitions.push({ name: 'threshold' });
      if (request.updateObjects[0].cron)
        columnDefinitions.push({ name: 'cron' });

      const values = request.updateObjects.map((el) => {
        const updateValues: any[] = [`'${el.id}'`];

        if (el.activated !== undefined) updateValues.push(el.activated);
        if (el.threshold) updateValues.push(el.threshold);
        if (el.frequency) updateValues.push(el.frequency);
        if (el.cron) updateValues.push(el.cron);

        return `(${updateValues.join(', ')})`;
      });

      const updateQuery = CitoDataQuery.getUpdateQuery(
        'cito.public.test_suites',
        columnDefinitions,
        values
      );

      const updateResult = await this.#querySnowflake.execute(
        { query: updateQuery },
        { jwt: auth.jwt }
      );

      if (!updateResult.success) throw new Error(updateResult.error);

      if (!updateResult.value) throw new Error(`Updating testSuites failed`);

      return Result.ok(updateResult.value);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}