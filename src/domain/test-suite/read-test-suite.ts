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

      if (!querySnowflakeResult.value)
        throw new Error(`TestSuite with id ${request.id} does not exist`);

      console.log(querySnowflakeResult.value.content);

      // if (testSuite.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(
        TestSuite.create({
          activated: true,
          executionFrequency: 1,
          id: 'dd',
          materializationAddress: 'aaas',
          threshold: 2,
          type: 'ColumnFreshness',
          organizationId: 'todo'
        })
      );
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
