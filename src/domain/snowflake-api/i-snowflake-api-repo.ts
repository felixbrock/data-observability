import { DbOptions } from '../services/i-db';
import Result from '../value-types/transient-types/result';

export interface SnowflakeEntity {
  [key: string]: unknown;
}

export type SnowflakeQueryResult = SnowflakeEntity[];

export interface ISnowflakeApiRepo {
  runQuery(queryText: string, binds: (string | number)[] | (string | number)[][], options: DbOptions): Promise<Result<SnowflakeQueryResult>>;
}
