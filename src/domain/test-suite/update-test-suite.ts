import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';

export interface UpdateTestSuiteRequestDto {
  id: string;
  activated: boolean;
}

export interface UpdateTestSuiteAuthDto {
  jwt: string;
}

export type UpdateTestSuiteResponseDto = Result<string>;

export class UpdateTestSuite
  implements
    IUseCase<
      UpdateTestSuiteRequestDto,
      UpdateTestSuiteResponseDto,
      UpdateTestSuiteAuthDto
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: UpdateTestSuiteRequestDto,
    auth: UpdateTestSuiteAuthDto
  ): Promise<UpdateTestSuiteResponseDto> {
    try {
      // todo -replace

      const readQuery = CitoDataQuery.getReadTestSuiteQuery(request.id);

      const readResult = await this.#querySnowflake.execute(
        { query: readQuery },
        { jwt: auth.jwt }
      );

      if (!readResult.success) throw new Error(readResult.error);

      if (!readResult.value)
        throw new Error(`TestSuite with id ${request.id} does not exist`);

      console.log(readResult.value.content);

      const updateQuery = CitoDataQuery.getUpdateTestSuiteQuery(
        request.id,
        request.activated
      );

      const updateResult = await this.#querySnowflake.execute(
        { query: updateQuery },
        { jwt: auth.jwt }
      );

      if (!updateResult.success) throw new Error(readResult.error);

      if (!updateResult.value)
        throw new Error(`Updating testSuite ${request.id} failed`);

      // if (testSuite.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(request.id);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}