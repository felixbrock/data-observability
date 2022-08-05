import { TestSuite } from '../entities/test-suite';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';
import { DbConnection } from '../services/i-db';
import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';

export interface ReadTestSuitesRequestDto {
  activated?: boolean;
  executionFrequency?: number;
}

export interface ReadTestSuitesAuthDto {
  jwt: string;
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

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: ReadTestSuitesRequestDto,
    auth: ReadTestSuitesAuthDto
  ): Promise<ReadTestSuitesResponseDto> {
    try {
      const query = CitoDataQuery.getReadTestSuitesQuery(
        request.executionFrequency,
        request.activated,
      );

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      const result = querySnowflakeResult.value;

      if (!result)
        throw new Error(`No test suites found that match condition`);

      const testSuites = Object.keys(result).map(key => {
        const organizationResult = result[key];

        const organizationTestSuites = organizationResult.map(element => TestSuite.create({
          id: element.ID,
          type: element.TEST_TYPE,
          activated: element.ACTIVATED,
          executionFrequency: element.EXECUTION_FREQUENCY,
          threshold: element.THRESHOLD,
          databaseName: element.DATABASE_NAME,
          schemaName: element.SCHEMA_NAME,
          materializationName: element.MATERIALIZATION_NAME,
          materializationType: element.MATERIALIZATION_TYPE,
          organizationId: element.ORGANIZATION_ID,
          columnName: element.COLUMN_NAME
        }));

        return organizationTestSuites;
        
      });

      // if (testSuite.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(testSuites.flat());

    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
