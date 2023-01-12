import BaseAuth from '../services/base-auth';
import BaseTriggerTestSuiteExecution from '../services/base-trigger-test-suite-execution';
import { IDb } from '../services/i-db';
import IUseCase from '../services/use-case';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { ExecutionType } from '../value-types/execution-type';
import Result from '../value-types/transient-types/result';
import { ReadQualTestSuite } from './read-qual-test-suite';

export interface TriggerQualTestSuiteExecutionRequestDto {
  id: string;
  targetOrgId?: string;
  executionType: ExecutionType;
}

export type TriggerQualTestSuiteExecutionAuthDto = BaseAuth;

export type TriggerQualTestSuiteExecutionResponseDto = Result<void>;

export class TriggerQualTestSuiteExecution
  extends BaseTriggerTestSuiteExecution
  implements
    IUseCase<
      TriggerQualTestSuiteExecutionRequestDto,
      TriggerQualTestSuiteExecutionResponseDto,
      TriggerQualTestSuiteExecutionAuthDto,
      IDb
    >
{
  readonly #readQualTestSuite: ReadQualTestSuite;

  readonly #executeTest: ExecuteTest;

  constructor(
    readQualTestSuite: ReadQualTestSuite,
    querySnowflake: QuerySnowflake,
    executeTest: ExecuteTest
  ) {
    super(querySnowflake);
    this.#readQualTestSuite = readQualTestSuite;
    this.#executeTest = executeTest;
  }

  async execute(props: {
    req: TriggerQualTestSuiteExecutionRequestDto;
    auth: TriggerQualTestSuiteExecutionAuthDto;
    db: IDb;
  }): Promise<TriggerQualTestSuiteExecutionResponseDto> {
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
      const readTestSuiteResult = await this.#readQualTestSuite.execute({
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
        console.log('Target mat not altered. Qual test not executed');

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
