// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { TestSuite, TestType } from '../entities/test-suite';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';

export interface CreateTestSuiteRequestDto {
  activated: boolean;
  type: TestType;
  threshold: number;
  executionFrequency: number;
  materializationAddress: string;
  columnName?: string;
}

export interface CreateTestSuiteAuthDto {
  jwt: string;
  organizationId: string
}

export type CreateTestSuiteResponseDto = Result<TestSuite>;

export class CreateTestSuite
  implements
    IUseCase<
      CreateTestSuiteRequestDto,
      CreateTestSuiteResponseDto,
      CreateTestSuiteAuthDto
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: CreateTestSuiteRequestDto,
    auth: CreateTestSuiteAuthDto
  ): Promise<CreateTestSuiteResponseDto> {
    try {
      const testSuite = TestSuite.create({
        id: new ObjectId().toHexString(),
        activated: request.activated,
        type: request.type,
        threshold: request.threshold,
        executionFrequency: request.executionFrequency,
        materializationAddress: request.materializationAddress,
        columnName: request.columnName,
        organizationId: auth.organizationId
      });

      const query = CitoDataQuery.getInsertTestSuiteQuery(testSuite);
    

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      // if (auth.organizationId !== 'TODO')
      //   throw new Error('Not authorized to perform action');

      return Result.ok(testSuite);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
