import { Pool } from 'generic-pool';
import { Connection, Statement } from 'snowflake-sdk';
import {
  Binds,
  ISnowflakeApiRepo,
  SnowflakeQueryResult,
} from '../../domain/snowflake-api/i-snowflake-api-repo';

export default class SnowflakeApiRepo implements ISnowflakeApiRepo {
  #getResultBaseMsg = (
    stringifiedBinds: string,
    queryText: string
  ): string => `Binds: ${stringifiedBinds.substring(0, 1000)}${
    stringifiedBinds.length > 1000 ? '...' : ''
  }
    \n${queryText.substring(0, 1000)}${queryText.length > 1000 ? '...' : ''}`;

  runQuery = async (
    queryText: string,
    binds: Binds,
    connectionPool: Pool<Connection>
  ): Promise<SnowflakeQueryResult> =>
    new Promise((resolve, reject) => {
      const results: SnowflakeQueryResult = [];

      const exit = (): void => {
        resolve(results);
      };

      const complete = (error: any, stmt: Statement): void => {
        if (error) {
          reject(
            new Error(
              `Failed to execute statement ${stmt.getStatementId()} due to the following error: ${
                error.message
              } \n${this.#getResultBaseMsg(JSON.stringify(binds), queryText)}`
            )
          );
        }

        const stream = stmt.streamRows();

        stream.on('data', (row: any) => {
          if (row) results.push(row);
        });
        stream.on('error', (err: Error): void => {
          reject(
            new Error(
              `Streaming of Snowflake query failed. Error: ${err}\n${this.#getResultBaseMsg(
                JSON.stringify(binds),
                queryText
              )}`
            )
          );
        });
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
        if (error instanceof Error) reject(error);
        if (typeof error === 'string') reject(new Error(error));
        throw new Error('Sf query not properly handled');
      }
    });
}
