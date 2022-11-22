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

      const stringifiedBinds = JSON.stringify(request.binds);

      if (!queryResult.success) {
        const queryResultBaseMsg = `Binds: ${stringifiedBinds.substring(
          0,
          1000
        )}${stringifiedBinds.length > 1000 ? '...' : ''}
          \n${request.queryText.substring(0, 1000)}${
          request.queryText.length > 1000 ? '...' : ''
        }`;

        throw new Error(
          `Sf query failed \n${queryResultBaseMsg} \nError msg: ${queryResult.error}`
        );
      }

      return Result.ok(queryResult.value);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
