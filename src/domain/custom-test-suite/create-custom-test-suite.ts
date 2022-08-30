// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { CustomTestSuite } from '../entities/custom-test-suite';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';

export interface CreateCustomTestSuiteRequestDto {
  activated: boolean;
  threshold: number;
  executionFrequency: number;
  name: string;
  description: string;
  sqlLogic: string;
  targetResourceIds: string[]
}

export interface CreateCustomTestSuiteAuthDto {
  jwt: string;
  callerOrganizationId: string;
}

export type CreateCustomTestSuiteResponseDto = Result<CustomTestSuite>;

export class CreateCustomTestSuite
  implements
    IUseCase<
      CreateCustomTestSuiteRequestDto,
      CreateCustomTestSuiteResponseDto,
      CreateCustomTestSuiteAuthDto
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: CreateCustomTestSuiteRequestDto,
    auth: CreateCustomTestSuiteAuthDto
  ): Promise<CreateCustomTestSuiteResponseDto> {
    try {
      const customTestSuite: CustomTestSuite = {
        id: new ObjectId().toHexString(),
        name: request.name,
        description: request.description,
        sqlLogic: request.sqlLogic,
        activated: request.activated,
        executionFrequency: request.executionFrequency,
        organizationId: auth.callerOrganizationId,
        threshold: request.threshold,
        targetResourceIds: request.targetResourceIds
      };

      const query = CitoDataQuery.getInsertCustomTestSuiteQuery(customTestSuite);

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      return Result.ok(customTestSuite);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
