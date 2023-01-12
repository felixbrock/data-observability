// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import { ReadCustomTestSuite } from './read-custom-test-suite';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { IDb } from '../services/i-db';
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

export class TriggerCustomTestSuiteExecution
  extends BaseTriggerTestSuiteExecution
  implements
    IUseCase<
      TriggerCustomTestSuiteExecutionRequestDto,
      TriggerCustomTestSuiteExecutionResponseDto,
      TriggerCustomTestSuiteExecutionAuthDto,
      IDb
    >
{
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

  async execute(props: {
    req: TriggerCustomTestSuiteExecutionRequestDto;
    auth: TriggerCustomTestSuiteExecutionAuthDto;
    db: IDb;
  }): Promise<TriggerCustomTestSuiteExecutionResponseDto> {
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
      const readCustomTestSuiteResult = await this.#readCustomTestSuite.execute(
        {
          req: { id: req.id },
          connPool: db.sfConnPool,
        }
      );

      if (!readCustomTestSuiteResult.success)
        throw new Error(readCustomTestSuiteResult.error);
      if (!readCustomTestSuiteResult.value)
        throw new Error('Reading custom test suite failed');

      const customTestSuite = readCustomTestSuiteResult.value;

      if (req.executionType === 'automatic') {
        throw new Error('Not implemented yet');
      }

      await this.#executeTest.execute({
        req: {
          testSuiteId: customTestSuite.id,
          testType: 'Custom',
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
