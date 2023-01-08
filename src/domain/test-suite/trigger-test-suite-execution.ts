// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadTestSuite } from './read-test-suite';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { IDb } from '../services/i-db';

import { ExecutionType } from '../value-types/execution-type';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';
import BaseTriggerTestSuiteExecution from '../services/base-trigger-test-suite-execution';

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
  extends BaseTriggerTestSuiteExecution
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

  constructor(
    readTestSuite: ReadTestSuite,
    executeTest: ExecuteTest,
    querySnowflake: QuerySnowflake
  ) {
    super(querySnowflake);
    this.#readTestSuite = readTestSuite;
    this.#executeTest = executeTest;
  }

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
        const wasAltered = await this.wasAltered(
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

      await this.#executeTest.execute(
        {
          testSuiteId: testSuite.id,
          testType: testSuite.type,
          targetOrgId: request.targetOrgId,
        },
        { jwt: auth.jwt }
      );

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
