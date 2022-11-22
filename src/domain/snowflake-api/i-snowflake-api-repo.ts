import Result from '../value-types/transient-types/result';

export interface SnowflakeEntity {
  [key: string]: unknown;
}

export type SnowflakeQueryResult = SnowflakeEntity[];

export type Bind = string | number;

export type Binds = Bind[] | Bind[][]

export interface IConnectionPool {
  use<U>(cb: (resource: unknown) => U | Promise<U>): Promise<U>;
  drain(): Promise<void>;
  clear(): Promise<void>
}

export interface ISnowflakeApiRepo {
  runQuery(
    queryText: string,
    binds: Binds,
    connectionPool: IConnectionPool
  ): Promise<Result<SnowflakeQueryResult>>;
}
