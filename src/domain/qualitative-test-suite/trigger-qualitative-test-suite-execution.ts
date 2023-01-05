import BaseAuth from '../services/base-auth';
import BaseTriggerTestSuiteExecution from '../services/base-trigger-test-suite-execution';
import { IDb } from '../services/i-db';
import IUseCase from '../services/use-case';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { ExecutionType } from '../value-types/execution-type';
import Result from '../value-types/transient-types/result';
import { ReadQualitativeTestSuite } from './read-qualitative-test-suite';

export interface TriggerQualitativeTestSuiteExecutionRequestDto {
  id: string;
  targetOrgId?: string;
  executionType: ExecutionType;
}

export type TriggerQualitativeTestSuiteExecutionAuthDto = BaseAuth;

export type TriggerQualitativeTestSuiteExecutionResponseDto = Result<void>;

export class TriggerQualitativeTestSuiteExecution
  extends BaseTriggerTestSuiteExecution
  implements
    IUseCase<
      TriggerQualitativeTestSuiteExecutionRequestDto,
      TriggerQualitativeTestSuiteExecutionResponseDto,
      TriggerQualitativeTestSuiteExecutionAuthDto,
      IDb
    >
{
  readonly #readQualitativeTestSuite: ReadQualitativeTestSuite;

  readonly #executeTest: ExecuteTest;

  constructor(
    readQualitativeTestSuite: ReadQualitativeTestSuite,
    querySnowflake: QuerySnowflake,
    executeTest: ExecuteTest
  ) {
    super(querySnowflake);
    this.#readQualitativeTestSuite = readQualitativeTestSuite;
    this.#executeTest = executeTest;
  }

  async execute(
    request: TriggerQualitativeTestSuiteExecutionRequestDto,
    auth: TriggerQualitativeTestSuiteExecutionAuthDto,
    db: IDb
  ): Promise<TriggerQualitativeTestSuiteExecutionResponseDto> {
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
      const readTestSuiteResult = await this.#readQualitativeTestSuite.execute(
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
        { jwt: auth.jwt },
        db.mongoConn
      );

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
