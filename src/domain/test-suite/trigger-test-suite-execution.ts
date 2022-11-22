// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadTestSuite } from './read-test-suite';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { IDb } from '../services/i-db';

import { ExecutionType } from '../value-types/execution-type';
import { Binds, IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';
import BaseAuth from '../services/base-auth';

export interface TriggerTestSuiteExecutionRequestDto {
  id: string;
  targetOrgId?: string;
  executionType: ExecutionType;
}

export interface TriggerTestSuiteExecutionAuthDto {
  jwt: string;
  callerOrgId?: string;
  isSystemInternal: boolean;
}

export type TriggerTestSuiteExecutionResponseDto = Result<void>;

export class TriggerTestSuiteExecution
  implements
    IUseCase<
      TriggerTestSuiteExecutionRequestDto,
      TriggerTestSuiteExecutionResponseDto,
      TriggerTestSuiteExecutionAuthDto,
      IDb
    >
{
  readonly #readTestSuite: ReadTestSuite;

  readonly #executeTest: ExecuteTest;

  readonly #querySnowflake: QuerySnowflake;

  constructor(
    readTestSuite: ReadTestSuite,
    executeTest: ExecuteTest,
    querySnowflake: QuerySnowflake
  ) {
    this.#readTestSuite = readTestSuite;
    this.#executeTest = executeTest;
    this.#querySnowflake = querySnowflake;
  }

  #wasAltered = async (
    props: {
      databaseName: string;
      schemaName: string;
      matName: string;
    },
    auth: BaseAuth,
    connPool: IConnectionPool
  ): Promise<boolean> => {
    const { databaseName, schemaName, matName } = props;

    const automaticExecutionFrequency = 5;

    // todo - get last test execution time
    const wasAlteredClause = `timediff(minute, convert_timezone('UTC', last_altered)::timestamp_ntz, sysdate()) < ${automaticExecutionFrequency}`;

    const binds: Binds = [databaseName, schemaName, matName];

    const queryText = `select ${wasAlteredClause} as was_altered from ${databaseName}.information_schema.tables
        where table_catalog = ? and table_schema = ? and table_name = ?;`;

    const querySnowflakeResult = await this.#querySnowflake.execute(
      { queryText, binds },
      auth,
      connPool
    );

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

  async execute(
    request: TriggerTestSuiteExecutionRequestDto,
    auth: TriggerTestSuiteExecutionAuthDto,
    db: IDb
  ): Promise<TriggerTestSuiteExecutionResponseDto> {
    if (auth.isSystemInternal && !request.targetOrgId)
      throw new Error('Target organization id missing');
    if (!auth.isSystemInternal && !auth.callerOrgId)
      throw new Error('Caller organization id missing');
    if (!request.targetOrgId && !auth.callerOrgId)
      throw new Error('No organization Id provided');
    if (request.executionType === 'automatic' && !request.targetOrgId)
      throw new Error(
        'When automatically executing test suite targetOrgId needs to be provided'
      );

    try {
      const readTestSuiteResult = await this.#readTestSuite.execute(
        { id: request.id },
        auth,
        db.sfConnPool
      );

      if (!readTestSuiteResult.success)
        throw new Error(readTestSuiteResult.error);
      if (!readTestSuiteResult.value)
        throw new Error('Reading test suite failed');

      const testSuite = readTestSuiteResult.value;

      if (request.executionType === 'automatic') {
        const wasAltered = !this.#wasAltered(
          {
            databaseName: testSuite.target.databaseName,
            schemaName: testSuite.target.schemaName,
            matName: testSuite.target.materializationName,
          },
          auth,
          db.sfConnPool
        );
        if (!wasAltered) return Result.ok();
      }

      const executeTestResult = await this.#executeTest.execute(
        {
          testSuiteId: testSuite.id,
          testType: testSuite.type,
          targetOrgId: request.targetOrgId,
        },
        { jwt: auth.jwt },
        db.mongoConn
      );

      if (!executeTestResult.success) throw new Error(executeTestResult.error);

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
