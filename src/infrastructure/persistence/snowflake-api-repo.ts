import {Pool} from 'generic-pool';
import { Connection, Statement } from 'snowflake-sdk';
import {
  Binds,
  ISnowflakeApiRepo,
  SnowflakeQueryResult,
} from '../../domain/snowflake-api/i-snowflake-api-repo';
import Result from '../../domain/value-types/transient-types/result';
import handleStreamError from './db/snowflake';

export default class SnowflakeApiRepo implements ISnowflakeApiRepo {
  runQuery = async (
    queryText: string,
    binds: Binds,
    connectionPool: Pool<Connection>
  ): Promise<Result<SnowflakeQueryResult>> =>
    new Promise((resolve) => {
      const results: SnowflakeQueryResult = [];

      const exit = (): void => {
        resolve(Result.ok(results));
      };

      const complete = (error: any, stmt: Statement): void => {
        if (error)
          console.error(
            `Failed to execute statement ${stmt.getStatementId()} due to the following error: ${
              error.message
            }`
          );

        const stream = stmt.streamRows();

        stream.on('data', (row: any) => {
          if (row) results.push(row);
        });
        stream.on('error', handleStreamError);
        stream.on('end', exit);
      };
      try {
        connectionPool.use(async (clientConnection: any) => {
          await clientConnection.execute({
            sqlText: queryText,
            binds,
            complete,
          });
        });
      } catch (error: unknown) {
        if (error instanceof Error && error.message)
          console.trace(error.message);
        else if (!(error instanceof Error) && error) console.trace(error);
        resolve(Result.fail(''));
      }
    });
}
