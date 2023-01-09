import Result from '../value-types/transient-types/result';

import {
  Binds,
  IConnectionPool,
  ISnowflakeApiRepo,
  SnowflakeQueryResult,
} from './i-snowflake-api-repo';
import IUseCase from '../services/use-case';

export interface QuerySnowflakeRequestDto {
  queryText: string;
  binds: Binds;
}

export type QuerySnowflakeAuthDto = null;

export type QuerySnowflakeResponseDto = Result<SnowflakeQueryResult>;

export class QuerySnowflake
  implements
    IUseCase<
      QuerySnowflakeRequestDto,
      QuerySnowflakeResponseDto,
      null,
      IConnectionPool
    >
{
  readonly #snowflakeApiRepo: ISnowflakeApiRepo;

  constructor(snowflakeApiRepo: ISnowflakeApiRepo) {
    this.#snowflakeApiRepo = snowflakeApiRepo;
  }

  async execute(props: {
    req: QuerySnowflakeRequestDto;
    connPool: IConnectionPool;
  }): Promise<QuerySnowflakeResponseDto> {
    try {
      const queryResult = await this.#snowflakeApiRepo.runQuery(
        props.req.queryText,
        props.req.binds,
        props.connPool
      );

      return Result.ok(queryResult);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
