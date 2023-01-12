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

  async execute(props: {
    req: TriggerTestSuiteExecutionRequestDto;
    auth: TriggerTestSuiteExecutionAuthDto;
    db: IDb;
  }): Promise<TriggerTestSuiteExecutionResponseDto> {
    const { req, auth, db } = props;

    if (auth.isSystemInternal && !req.targetOrgId)
      throw new Error('Target organization id missing');
    if (!auth.isSystemInternal && !auth.callerOrgId)
      throw new Error('Caller organization id missing');
    if (!req.targetOrgId && !auth.callerOrgId)
      throw new Error('No organization Id provided');
    if (req.executionType === 'automatic' && !req.targetOrgId)
      throw new Error(
        'When automatically executing test suite targetOrgId needs to be provided'
      );

    try {
      const readTestSuiteResult = await this.#readTestSuite.execute({
        req: { id: req.id },
        connPool: db.sfConnPool,
      });

      if (!readTestSuiteResult.success)
        throw new Error(readTestSuiteResult.error);
      if (!readTestSuiteResult.value)
        throw new Error('Reading test suite failed');

      const testSuite = readTestSuiteResult.value;

      const wasAltered = await this.wasAltered(
        {
          databaseName: testSuite.target.databaseName,
          schemaName: testSuite.target.schemaName,
          matName: testSuite.target.materializationName,
        },
        req.executionType === 'automatic' ? 5 : 60,
        db.sfConnPool
      );

      if (!wasAltered) {
        console.log('Target mat not altered. Quant test not executed');

        return Result.ok();
      }

      await this.#executeTest.execute({
        req: {
          testSuiteId: testSuite.id,
          testType: testSuite.type,
          targetOrgId: req.targetOrgId,
        },
        auth: { jwt: auth.jwt, isSystemInternal: auth.isSystemInternal },
        db,
      });

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
