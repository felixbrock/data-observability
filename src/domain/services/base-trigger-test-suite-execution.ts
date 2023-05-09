import { Binds, IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';
import { IDbConnection } from './i-db';

type TestCategory = 'qual' | 'quant';

export default abstract class BaseTriggerTestSuiteExecution {
  #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  #getLastExecutionDate = async (
    testSuiteId: string,
    testCategory: TestCategory,
    dbConnection: IDbConnection,
    callerOrgId: string
  ): Promise<Date | undefined> => {

    const table = testCategory === 'quant' ? 'test_executions' : 'test_executions_qual';
    const result = await dbConnection
    .collection(`${table}_${callerOrgId}`)
    .aggregate([
      { $match: { test_suite_id: testSuiteId } },
      { $project: { executed_on: 1} },
      { $sort: { 'executed_on': -1} }
    ]).toArray().then((res) => res[0]);

    if (!result) return undefined;

    const isDate = (obj: unknown): obj is Date =>
      !!obj && typeof obj === 'object' && obj.constructor.name === 'Date';

    const lastExecutedOn = result.executed_on;

    if (!lastExecutedOn) return undefined;

    const lastExecutedOnDate = new Date(lastExecutedOn);

    if (!isDate(lastExecutedOnDate))
      throw new Error('Received executed on in wrong format');

    return lastExecutedOnDate;
  };

  #getMinuteDiff = (date1: number, date2: number): number => {
    const diffTime = Math.abs(date2 - date1);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    return diffMinutes;
  };

  #getTimeDiff = async (
    testSuiteId: string,
    testCategory: TestCategory,
    dbConnection: IDbConnection,
    callerOrgId: string
  ): Promise<number | undefined> => {
    const lastExecutedOn = await this.#getLastExecutionDate(
      testSuiteId,
      testCategory,
      dbConnection,
      callerOrgId
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
    dbConnection: IDbConnection,
    callerOrgId: string,
    executionFrequency?: number,
  ): Promise<boolean> => {
    const { databaseName, schemaName, matName, testSuiteId, testCategory } =
      targetProps;

    const minutes =
      executionFrequency ||
      (await this.#getTimeDiff(testSuiteId, testCategory, dbConnection, callerOrgId));

    if (!minutes) {
      console.log(`Not able to determine last test execution`);

      return true;
    }

    console.log(
      `Last test execution ${minutes} minutes ago (cron schedule: ${targetProps.cron})`
    );

    const wasAlteredClause = `timediff(minute, convert_timezone('UTC', last_altered)::timestamp_ntz, sysdate()) < ${minutes}`;

    const binds: Binds = [databaseName, schemaName, matName];

    const queryText = `select ${wasAlteredClause} as was_altered from "${databaseName}".information_schema.tables
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
