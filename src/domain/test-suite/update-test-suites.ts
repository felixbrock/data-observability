import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';
import { SnowflakeQueryResultDto } from '../integration-api/snowflake/snowlake-query-result-dto';

interface UpdateObject {
  id: string;
  activated?: boolean;
  threshold?: number;
  frequency?: number;
}

export interface UpdateTestSuitesRequestDto {
  updateObjects: UpdateObject[];
}

export interface UpdateTestSuitesAuthDto {
  callerOrganizationId: string;
  jwt: string;
}

export type UpdateTestSuitesResponseDto = Result<SnowflakeQueryResultDto[]>;

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
      if (!request.updateObjects.length) return Result.ok();

      const updateResultObjects = await Promise.all(
        request.updateObjects.map(async (updateObj) => {
          const readQuery = CitoDataQuery.getReadTestSuiteQuery(
            updateObj.id,
            false
          );

          const readResult = await this.#querySnowflake.execute(
            { query: readQuery },
            { jwt: auth.jwt }
          );

          if (!readResult.success) throw new Error(readResult.error);

          if (!readResult.value)
            throw new Error(`Error when running snowflake query`);
          if (!readResult.value[Object.keys(readResult.value)[0]].length)
            throw new Error('Test suite not found');

          // if (readResult.value[auth.callerOrganizationId].organizationId !== auth.callerOrganizationId)
          //   throw new Error('Not authorized to perform action');

          const updateQuery = CitoDataQuery.getUpdateTestSuiteQuery(
            updateObj.id,
            updateObj.activated,
            updateObj.threshold,
            updateObj.frequency
          );

          const updateResult = await this.#querySnowflake.execute(
            { query: updateQuery },
            { jwt: auth.jwt }
          );

          if (!updateResult.success) throw new Error(updateResult.error);

          if (!updateResult.value)
            throw new Error(`Updating testSuite ${updateObj.id} failed`);

          return updateResult.value;
        })
      );

      return Result.ok(updateResultObjects);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
