import { Binds, IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';

type TestCategory = 'qual' | 'quant';

export default abstract class BaseTriggerTestSuiteExecution {
  #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  #getLastExecutionDate = async (
    connPool: IConnectionPool,
    testSuiteId: string,
    testCategory: TestCategory
  ): Promise<Date | undefined> => {
    const queryText = `select executed_on from cito.observability.${
      testCategory === 'quant' ? 'test_executions' : 'test_executions_qual'
    } where test_suite_id = '${testSuiteId}' order by executed_on desc limit 1;`;

    const binds: Binds = [];

    const querySnowflakeResult = await this.#querySnowflake.execute({
      req: { queryText, binds },
      connPool,
    });

    if (!querySnowflakeResult.success)
      throw new Error(querySnowflakeResult.error);

    const result = querySnowflakeResult.value;
    if (!result) throw new Error(`"Get last executed on" query failed`);

    if (!result.length) return undefined;

    if (result.length > 1)
      throw new Error(
        'Multiple executed on were returned. Expected zero or one result'
      );

    const isDate = (obj: unknown): obj is Date =>
      !!obj && typeof obj === 'object' && obj.constructor.name === 'Date';

    const lastExecutedOn = result[0].EXECUTED_ON;

    if (!lastExecutedOn) return undefined;

    if (!isDate(lastExecutedOn))
      throw new Error('Received executed on in wrong format');

    return lastExecutedOn;
  };

  #getMinuteDiff = (date1: number, date2: number): number => {
    const diffTime = Math.abs(date2 - date1);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    return diffMinutes;
  };

  #getTimeDiff = async (
    testSuiteId: string,
    connPool: IConnectionPool,
    testCategory: TestCategory
  ): Promise<number | undefined> => {
    const lastExecutedOn = await this.#getLastExecutionDate(
      connPool,
      testSuiteId,
      testCategory
    );

    if (!lastExecutedOn) return undefined;

    return this.#getMinuteDiff(new Date().getTime(), lastExecutedOn.getTime());
  };

  wasAltered = async (
    targetProps: {
      databaseName: string;
      schemaName: string;
      matName: string;
      testSuiteId: string;
      testCategory: TestCategory;
      cron: string;
    },
    connPool: IConnectionPool,
    executionFrequency?: number
  ): Promise<boolean> => {
    const { databaseName, schemaName, matName, testSuiteId, testCategory } =
      targetProps;

    const minutes =
      executionFrequency ||
      (await this.#getTimeDiff(testSuiteId, connPool, testCategory));

    if (!minutes) {
      console.log(`Not able to determine last test execution`);

      return true;
    }

    console.log(
      `Last test execution ${minutes} minutes ago (cron schedule: ${targetProps.cron})`
    );

    const wasAlteredClause = `timediff(minute, convert_timezone('UTC', last_altered)::timestamp_ntz, sysdate()) < ${minutes}`;

    const binds: Binds = [databaseName, schemaName, matName];

    const queryText = `select ${wasAlteredClause} as was_altered from ${databaseName}.information_schema.tables
            where table_catalog ilike ? and table_schema ilike ? and table_name ilike ?;`;

    const querySnowflakeResult = await this.#querySnowflake.execute({
      req: { queryText, binds },
      connPool,
    });

    if (!querySnowflakeResult.success)
      throw new Error(querySnowflakeResult.error);

    const result = querySnowflakeResult.value;
    if (!result) throw new Error(`"Was altered" query failed`);

    if (result.length !== 1)
      throw new Error('No or multiple was altered results received found');

    const wasAltered = result[0].WAS_ALTERED;
    if (typeof wasAltered !== 'boolean')
      throw new Error('Received non-bool was altered val');

    return wasAltered;
  };
}
