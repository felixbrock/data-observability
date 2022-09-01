import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { CustomTestSuiteDto } from '../entities/custom-test-suite';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';

export interface ReadCustomTestSuiteRequestDto {
  id: string;
}

export interface ReadCustomTestSuiteAuthDto {
  jwt: string;
  callerOrganizationId: string;
}

export type ReadCustomTestSuiteResponseDto = Result<CustomTestSuiteDto>;

export class ReadCustomTestSuite
  implements
    IUseCase<
      ReadCustomTestSuiteRequestDto,
      ReadCustomTestSuiteResponseDto,
      ReadCustomTestSuiteAuthDto
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: ReadCustomTestSuiteRequestDto,
    auth: ReadCustomTestSuiteAuthDto
  ): Promise<ReadCustomTestSuiteResponseDto> {
    try {
      // todo -replace

      const query = CitoDataQuery.getReadTestSuiteQuery(request.id, true);

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      const result = querySnowflakeResult.value;

      if (!result)
        throw new Error(`CustomTestSuite with id ${request.id} does not exist`);

      const organizationResults = result[auth.callerOrganizationId];

      if (organizationResults.length !== 1)
        throw new Error('No or multiple custom test suites found');

      // if (customTestSuite.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok({
        id: organizationResults[0].ID,
        activated: organizationResults[0].ACTIVATED,
        executionFrequency: organizationResults[0].EXECUTION_FREQUENCY,
        threshold: organizationResults[0].THRESHOLD,
        name: organizationResults[0].NAME,
        description: organizationResults[0].DESCRIPTION,
        sqlLogic: organizationResults[0].SQL_LOGIC,
        targetResourceIds: organizationResults[0].TARGET_RESOURCE_IDS,
        organizationId: organizationResults[0].ORGANIZATION_ID,
      });
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
