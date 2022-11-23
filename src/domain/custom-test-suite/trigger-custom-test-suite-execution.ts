// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import { ReadCustomTestSuite } from './read-custom-test-suite';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { IDb} from '../services/i-db';
import { ExecutionType } from '../value-types/execution-type';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import BaseTriggerTestSuiteExecution from '../services/base-trigger-test-suite-execution';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';

export interface TriggerCustomTestSuiteExecutionRequestDto {
  id: string;
  targetOrgId?: string;
  executionType: ExecutionType;
}

export type TriggerCustomTestSuiteExecutionAuthDto = BaseAuth;

export type TriggerCustomTestSuiteExecutionResponseDto = Result<void>;

export class TriggerCustomTestSuiteExecution extends BaseTriggerTestSuiteExecution implements IUseCase<
  TriggerCustomTestSuiteExecutionRequestDto,
  TriggerCustomTestSuiteExecutionResponseDto,
  TriggerCustomTestSuiteExecutionAuthDto,
  IDb
> {
  readonly #readCustomTestSuite: ReadCustomTestSuite;

  readonly #executeTest: ExecuteTest;

  constructor(
    readCustomTestSuite: ReadCustomTestSuite,
    querySnowflake: QuerySnowflake,
    executeTest: ExecuteTest
  ) {
    super(querySnowflake);
    this.#readCustomTestSuite = readCustomTestSuite;
    this.#executeTest = executeTest;
  }

  async execute(
    request: TriggerCustomTestSuiteExecutionRequestDto,
    auth: TriggerCustomTestSuiteExecutionAuthDto,
    db: IDb
  ): Promise<TriggerCustomTestSuiteExecutionResponseDto> {
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
      const readCustomTestSuiteResult = await this.#readCustomTestSuite.execute(
        { id: request.id},
        auth, db.sfConnPool
      );

      if (!readCustomTestSuiteResult.success)
        throw new Error(readCustomTestSuiteResult.error);
      if (!readCustomTestSuiteResult.value)
        throw new Error('Reading custom test suite failed');

      const customTestSuite = readCustomTestSuiteResult.value;

      if (request.executionType === 'automatic') {
        throw new Error('Not implemented yet');
      }

      const executeTestResult = await this.#executeTest.execute(
        {
          testSuiteId: customTestSuite.id,
          testType: 'Custom',
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
