import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export type IDbConnection = unknown;

export interface IDb {
  sfConnPool: IConnectionPool;
  mongoConn: IDbConnection;
}

export type DbOptions = {
  account: string;
  username: string;
  password: string;
  warehouse: string;
  application: string;
};
