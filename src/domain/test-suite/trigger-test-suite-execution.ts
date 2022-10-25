// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadTestSuite } from './read-test-suite';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';

export interface TriggerTestSuiteExecutionRequestDto {
  id: string;
  targetOrganizationId?: string;
}

export interface TriggerTestSuiteExecutionAuthDto {
  jwt: string;
  callerOrganizationId?: string;
  isSystemInternal: boolean;
}

export type TriggerTestSuiteExecutionResponseDto = Result<void>;

export class TriggerTestSuiteExecution
  implements
    IUseCase<
      TriggerTestSuiteExecutionRequestDto,
      TriggerTestSuiteExecutionResponseDto,
      TriggerTestSuiteExecutionAuthDto,
      DbConnection
    >
{
  readonly #readTestSuite: ReadTestSuite;

  readonly #executeTest: ExecuteTest;

  #dbConnection: DbConnection;

  constructor(readTestSuite: ReadTestSuite, executeTest: ExecuteTest) {
    this.#readTestSuite = readTestSuite;
    this.#executeTest = executeTest;
  }

  async execute(
    request: TriggerTestSuiteExecutionRequestDto,
    auth: TriggerTestSuiteExecutionAuthDto,
    dbConnection: DbConnection
  ): Promise<TriggerTestSuiteExecutionResponseDto> {
    if (auth.isSystemInternal && !request.targetOrganizationId)
    throw new Error('Target organization id missing');
  if (!auth.isSystemInternal && !auth.callerOrganizationId)
    throw new Error('Caller organization id missing');
  if (!request.targetOrganizationId && !auth.callerOrganizationId)
    throw new Error('No organization Id provided');

    this.#dbConnection = dbConnection;

    try {
      const readTestSuiteResult = await this.#readTestSuite.execute(
        { id: request.id, targetOrganizationId: request.targetOrganizationId },
        {
          jwt: auth.jwt,
          callerOrganizationId: auth.callerOrganizationId,
          isSystemInternal: auth.isSystemInternal,
        }
      );

      if (!readTestSuiteResult.success)
        throw new Error(readTestSuiteResult.error);
      if (!readTestSuiteResult.value)
        throw new Error('Reading test suite failed');

      const testSuite = readTestSuiteResult.value;

      const executeTestResult = await this.#executeTest.execute(
        {
          testSuiteId: testSuite.id,
          testType: testSuite.type,
          targetOrganizationId: request.targetOrganizationId
        },
        { jwt: auth.jwt },
        this.#dbConnection
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
