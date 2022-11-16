import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';

import { SnowflakeQueryResultDto } from '../integration-api/snowflake/snowlake-query-result-dto';
import { ExecutionType } from '../value-types/execution-type';
import { GetSnowflakeProfile } from '../integration-api/get-snowflake-profile';

interface UpdateObject {
  id: string;
  activated?: boolean;
  threshold?: number;
  frequency?: number;
  cron?: string;
  executionType?: ExecutionType;
}

export interface UpdateTestSuitesRequestDto {
  updateObjects: UpdateObject[];
}

export interface UpdateTestSuitesAuthDto {
  callerOrgId: string;
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
    request: UpdateTestSuitesRequestDto,
    auth: UpdateTestSuitesAuthDto
  ): Promise<UpdateTestSuitesResponseDto> {
    try {
      const nothingToUpdate =
        request.updateObjects[0].activated === undefined &&
        !request.updateObjects[0].frequency &&
        !request.updateObjects[0].executionType &&
        !request.updateObjects[0].cron &&
        !request.updateObjects[0].threshold;
      if (!request.updateObjects.length || nothingToUpdate) return Result.ok();

      const readQuery = CitoDataQuery.getReadTestSuiteQuery(
        request.updateObjects.map((el) => el.id),
        'test_suites'
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
      if (request.updateObjects[0].executionType)
        columnDefinitions.push({ name: 'execution_type' });
      if (request.updateObjects[0].threshold)
        columnDefinitions.push({ name: 'threshold' });
      if (request.updateObjects[0].cron)
        columnDefinitions.push({ name: 'cron' });

      const values = request.updateObjects.map((el) => {
        const updateValues: any[] = [`'${el.id}'`];

        if (el.activated !== undefined) updateValues.push(el.activated);
        if (el.threshold) updateValues.push(el.threshold);
        if (el.frequency) updateValues.push(el.frequency);
        if (el.executionType) updateValues.push(`'${el.executionType}'`);
        if (el.cron) updateValues.push(`'${el.cron}'`);

        return `(${updateValues.join(', ')})`;
      });

      const updateQuery = CitoDataQuery.getUpdateQuery(
        'cito.observability.test_suites',
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
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
