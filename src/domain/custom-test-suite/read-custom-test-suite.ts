import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { CustomTestSuiteDto } from '../entities/custom-test-suite';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';

export interface ReadCustomTestSuiteRequestDto {
  id: string;
  targetOrganizationId?: string;
}

export interface ReadCustomTestSuiteAuthDto {
  jwt: string;
  callerOrganizationId?: string;
  isSystemInternal: boolean;
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
    if (auth.isSystemInternal && !request.targetOrganizationId)
      throw new Error('Target organization id missing');
    if (!auth.isSystemInternal && !auth.callerOrganizationId)
      throw new Error('Caller organization id missing');
    if (!request.targetOrganizationId && !auth.callerOrganizationId)
      throw new Error('No organization Id provided');

      let organizationId;
      if (auth.isSystemInternal && request.targetOrganizationId)
        organizationId = request.targetOrganizationId;
      else if (auth.callerOrganizationId)
        organizationId = auth.callerOrganizationId;
      else throw new Error('Unhandled organizationId allocation');


    try {
      // todo -replace

      const query = CitoDataQuery.getReadTestSuiteQuery(
        [request.id],
        'test_suites_custom'
      );

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query, targetOrganizationId: request.targetOrganizationId },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      const result = querySnowflakeResult.value;

      if (!result)
        throw new Error(`CustomTestSuite with id ${request.id} does not exist`);

      const organizationResults = result[organizationId];

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
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
