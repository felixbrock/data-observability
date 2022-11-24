import Result from '../value-types/transient-types/result';
 
import {
  Binds,
  IConnectionPool,
  ISnowflakeApiRepo,
  SnowflakeQueryResult,
} from './i-snowflake-api-repo';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';

export interface QuerySnowflakeRequestDto {
  queryText: string;
  binds: Binds;
}

export type QuerySnowflakeAuthDto = BaseAuth


export type QuerySnowflakeResponseDto = Result<SnowflakeQueryResult>;

export class QuerySnowflake implements IUseCase<
  QuerySnowflakeRequestDto,
  QuerySnowflakeResponseDto,
  QuerySnowflakeAuthDto, 
  IConnectionPool
> {
  readonly #snowflakeApiRepo: ISnowflakeApiRepo;

  constructor(snowflakeApiRepo: ISnowflakeApiRepo) {
    this.#snowflakeApiRepo = snowflakeApiRepo;
  }

  async execute(
    request: QuerySnowflakeRequestDto,
    auth: QuerySnowflakeAuthDto,
    connPool: IConnectionPool
  ): Promise<QuerySnowflakeResponseDto> {
    try {
      const queryResult = await this.#snowflakeApiRepo.runQuery(
        request.queryText,
        request.binds,
        connPool
      );

      return Result.ok(queryResult);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
