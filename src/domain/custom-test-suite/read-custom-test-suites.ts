import { CustomTestSuite } from '../entities/custom-test-suite';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';
import { DbConnection } from '../services/i-db';
import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';

export interface ReadCustomTestSuitesRequestDto {
  activated?: boolean;
  executionFrequency?: number;
}

export interface ReadCustomTestSuitesAuthDto {
  jwt: string;
  isSystemInternal: boolean;
  callerOrganizationId?: string;
}

export type ReadCustomTestSuitesResponseDto = Result<CustomTestSuite[]>;

export class ReadCustomTestSuites
  implements
    IUseCase<
      ReadCustomTestSuitesRequestDto,
      ReadCustomTestSuitesResponseDto,
      ReadCustomTestSuitesAuthDto,
      DbConnection
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: ReadCustomTestSuitesRequestDto,
    auth: ReadCustomTestSuitesAuthDto
  ): Promise<ReadCustomTestSuitesResponseDto> {
    if (!auth.isSystemInternal && !auth.callerOrganizationId)
      throw new Error('Not authorized to perform operation');

    try {
      const query = CitoDataQuery.getReadTestSuitesQuery(
        true,
        request.executionFrequency,
        request.activated
      );

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      const result = querySnowflakeResult.value;

      if (!result) throw new Error(`No test suites found that match condition`);

      const customTestSuites = Object.keys(result).map((key) => {
        const organizationResult = result[key];

        const organizationCustomTestSuites = organizationResult.map(
          (element): CustomTestSuite => ({
            id: element.ID,
            activated: element.ACTIVATED,
            executionFrequency: element.EXECUTION_FREQUENCY,
            threshold: element.THRESHOLD,
            name: element.NAME,
            description: element.DESCRIPTION,
            sqlLogic: element.SQL_LOGIC,
            targetResourceIds: element.TARGET_RESOURCE_IDS,
            organizationId: element.ORGANIZATION_ID,
          })
        );

        return organizationCustomTestSuites;
      });

      // if (customTestSuite.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(customTestSuites.flat());
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
