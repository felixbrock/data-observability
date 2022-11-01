import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery, { ColumnDefinition } from '../services/cito-data-query';
import { SnowflakeQueryResultDto } from '../integration-api/snowflake/snowlake-query-result-dto';
import { ExecutionType } from '../value-types/execution-type';

interface UpdateObject {
  id: string;
  activated?: boolean;
  threshold?: number;
  frequency?: number;
  cron?: string;
  executionType?: ExecutionType;
}

export interface UpdateNominalTestSuitesRequestDto {
  updateObjects: UpdateObject[];
}

export interface UpdateNominalTestSuitesAuthDto {
  callerOrganizationId: string;
  jwt: string;
}

export type UpdateNominalTestSuitesResponseDto = Result<SnowflakeQueryResultDto>;

export class UpdateNominalTestSuites
  implements
    IUseCase<
      UpdateNominalTestSuitesRequestDto,
      UpdateNominalTestSuitesResponseDto,
      UpdateNominalTestSuitesAuthDto
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: UpdateNominalTestSuitesRequestDto,
    auth: UpdateNominalTestSuitesAuthDto
  ): Promise<UpdateNominalTestSuitesResponseDto> {
    try {
      const nothingToUpdate =
        request.updateObjects[0].activated === undefined &&
        !request.updateObjects[0].frequency &&
        !request.updateObjects[0].cron &&
        !request.updateObjects[0].threshold &&
        !request.updateObjects[0].executionType;
      if (!request.updateObjects.length || nothingToUpdate) return Result.ok();

      const readQuery = CitoDataQuery.getReadTestSuiteQuery(
        request.updateObjects.map((el) => el.id),
        'test_suites_nominal'
      );

      const readResult = await this.#querySnowflake.execute(
        { query: readQuery },
        { jwt: auth.jwt }
      );

      if (!readResult.success) throw new Error(readResult.error);

      const nominalTestSuites = readResult.value;

      if (!nominalTestSuites) throw new Error(`Error when running snowflake query`);
      if (!nominalTestSuites[Object.keys(nominalTestSuites)[0]].length)
        throw new Error('Test suites not found');
      if (
        nominalTestSuites[Object.keys(nominalTestSuites)[0]].length !==
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
        if (request.updateObjects[0].executionType)
        columnDefinitions.push({ name: 'execution_type' });

      const values = request.updateObjects.map((el) => {
        const updateValues: any[] = [`'${el.id}'`];

        if (el.activated !== undefined) updateValues.push(el.activated);
        if (el.threshold) updateValues.push(el.threshold);
        if (el.frequency) updateValues.push(el.frequency);
        if (el.cron) updateValues.push(el.cron);
        if (el.executionType) updateValues.push(el.executionType);

        return `(${updateValues.join(', ')})`;
      });

      const updateQuery = CitoDataQuery.getUpdateQuery(
        'cito.observability.test_suites_nominal',
        columnDefinitions,
        values
      );

      const updateResult = await this.#querySnowflake.execute(
        { query: updateQuery },
        { jwt: auth.jwt }
      );

      if (!updateResult.success) throw new Error(updateResult.error);

      if (!updateResult.value) throw new Error(`Updating nominalTestSuites failed`);

      return Result.ok(updateResult.value);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
