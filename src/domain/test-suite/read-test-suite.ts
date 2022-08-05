import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { TestSuite } from '../entities/test-suite';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';

export interface ReadTestSuiteRequestDto {
  id: string;
}

export interface ReadTestSuiteAuthDto {
  jwt: string;
  organizationId: string;
}

export type ReadTestSuiteResponseDto = Result<TestSuite>;

export class ReadTestSuite
  implements
    IUseCase<
      ReadTestSuiteRequestDto,
      ReadTestSuiteResponseDto,
      ReadTestSuiteAuthDto
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: ReadTestSuiteRequestDto,
    auth: ReadTestSuiteAuthDto
  ): Promise<ReadTestSuiteResponseDto> {
    try {
      // todo -replace

      const query = CitoDataQuery.getReadTestSuiteQuery(request.id);

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      const result = querySnowflakeResult.value;

      if (!result)
        throw new Error(`TestSuite with id ${request.id} does not exist`);

      const organizationResults = result[auth.organizationId];

      if(organizationResults.length !== 1)
        throw new Error('No or multiple test suites found');

      // if (testSuite.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(
        TestSuite.create({
          id: organizationResults[0].ID,
          type: organizationResults[0].TEST_TYPE,
          activated: organizationResults[0].ACTIVATED,
          executionFrequency: organizationResults[0].EXECUTION_FREQUENCY,
          threshold: organizationResults[0].THRESHOLD,
          materializationAddress: organizationResults[0].MATERIALIZATION_ADDRESS,
          organizationId: organizationResults[0].ORGANIZATION_ID,
          columnName: organizationResults[0].COLUMN_NAME
        })
      );
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
