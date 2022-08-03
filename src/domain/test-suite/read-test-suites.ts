import { TestSuite } from '../entities/test-suite';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';
import { DbConnection } from '../services/i-db';
import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';

export interface ReadTestSuitesRequestDto {
  activated?: boolean;
  executionFrequency: number;
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
        request.activated
      );

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      if (!querySnowflakeResult.value)
        throw new Error(`No test suites found that match condition`);

      console.log(querySnowflakeResult.value.content);

      // if (testSuite.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok([
        TestSuite.create({
          activated: true,
          executionFrequency: 1,
          id: 'dd',
          materializationAddress: 'aaas',
          threshold: 2,
          type: 'ColumnFreshness',
          organizationId: 'todo'
        }),
      ]);

    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
