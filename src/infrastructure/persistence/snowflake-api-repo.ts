import { Connection, Statement } from 'snowflake-sdk';
import { DbOptions } from '../../domain/services/i-db';
import { connect, handleStreamError } from './db/snowflake';
import {
  ISnowflakeApiRepo,
  SnowflakeQueryResult,
} from '../../domain/snowflake-api/i-snowflake-api-repo';
import { appConfig } from '../../config';
import Result from '../../domain/value-types/transient-types/result';

export default class SnowflakeApiRepo implements ISnowflakeApiRepo {
  runQuery = async (
    queryText: string,
    binds: (string | number)[] | (string | number)[][],
    options: DbOptions
  ): Promise<Result<SnowflakeQueryResult>> =>
    new Promise((resolve) => {
      const results: SnowflakeQueryResult = [];

      const destroy = (conn: Connection, error?: Error): void => {
        if (!conn.isUp()) return;

        conn.destroy((destroyError: any, connectionToDestroy: Connection) => {
          if (destroyError)
            console.error(`Unable to disconnect: ${destroyError.message}`);
          else {
            // console.log(
            //   `Disconnected connection with id: ${connectionToDestroy.getId()}`
            // );
            if (error)
              resolve(
                Result.fail(
                  `Disconnecting sf connection ${connectionToDestroy.getId()} failed: ${
                    error.message
                  }`
                )
              );
            resolve(Result.ok(results));
          }
        });
      };

      const connection = connect({
        ...options,
        application: appConfig.snowflake.applicationName,
      });

      connection.connect((err, conn) => {
        try {
          if (err) {
            if (typeof err === 'string') resolve(Result.fail(err));
            if (err instanceof Error) resolve(Result.fail(err.message));
            resolve(Result.fail('Unknown Snowflake connection error occured'));
          }

          // Optional: store the connection ID.
          // const connectionId = conn.getId();
          // console.log(`Executing sf query \nConnectionId: ${connectionId}`);

          const complete = (error: any, stmt: Statement): void => {
            if (error) {
              console.error(
                `Failed to execute statement ${stmt.getStatementId()} due to the following error: ${
                  error.message
                }`
              );
              destroy(conn, new Error(`Snowflake query ${error.message}`));
            }
          };

          // todo - include select statements once dwh-to-dashboard is going to be implemented
          const statement = conn.execute({
            sqlText: queryText,
            binds,
            complete,
          });

          const stream = statement.streamRows();

          stream.on('data', (row: any) => {
            if (row) results.push(row);
          });
          stream.on('error', handleStreamError);
          stream.on('end', () => destroy(conn));
        } catch (error: unknown) {
          if (error instanceof Error && error.message)
            console.trace(error.message);
          else if (!(error instanceof Error) && error) console.trace(error);
          resolve(Result.fail(''));
        }
      });
    });
}
