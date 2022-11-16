import { TestSuite } from '../entities/test-suite';
import { GetSnowflakeProfile } from '../integration-api/get-snowflake-profile';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';

import { DbConnection } from '../services/i-db';
import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';

export interface ReadTestSuitesRequestDto {
  activated?: boolean;
}

export interface ReadTestSuitesAuthDto {
  jwt: string;
  isSystemInternal: boolean;
  callerOrgId?: string;
}

export type ReadTestSuitesResponseDto = Result<TestSuite[]>;

export class ReadTestSuites
  implements
    IUseCase<
      ReadTestSuitesRequestDto,
      ReadTestSuitesResponseDto,
      ReadTestSuitesAuthDto,
      DbConnection
    >
{
  readonly #querySnowflake: QuerySnowflake;

  readonly #getSnowflakeProfile: GetSnowflakeProfile;

  constructor(
    querySnowflake: QuerySnowflake,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
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
    request: ReadTestSuitesRequestDto,
    auth: ReadTestSuitesAuthDto
  ): Promise<ReadTestSuitesResponseDto> {
    if (!auth.isSystemInternal && !auth.callerOrgId)
      throw new Error('Not authorized to perform operation');

    try {
      const query = CitoDataQuery.getReadTestSuitesQuery(
        'test_suites',
        [],
        request.activated !== undefined
          ? `activated = ${request.activated}`
          : undefined
      );

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      const result = querySnowflakeResult.value;

      if (!result) throw new Error(`No test suites found that match condition`);

      const testSuites = Object.keys(result).map((key) => {
        const organizationResult = result[key];

        const organizationTestSuites = organizationResult.map((element) =>
          TestSuite.create({
            id: element.ID,
            type: element.TEST_TYPE,
            activated: element.ACTIVATED,
            executionFrequency: element.EXECUTION_FREQUENCY,
            threshold: element.THRESHOLD,
            target: {
              databaseName: element.DATABASE_NAME,
              schemaName: element.SCHEMA_NAME,
              materializationName: element.MATERIALIZATION_NAME,
              materializationType: element.MATERIALIZATION_TYPE,
              columnName: element.COLUMN_NAME,
              targetResourceId: element.TARGET_RESOURCE_ID,
            },
            organizationId: element.ORGANIZATION_ID,
            cron: element.CRON,
            executionType: element.EXECUTION_TYPE,
          })
        );

        return organizationTestSuites;
      });

      // if (testSuite.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(testSuites.flat());
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
