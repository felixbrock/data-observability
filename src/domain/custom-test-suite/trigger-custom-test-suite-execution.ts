// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadCustomTestSuite } from './read-custom-test-suite';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';

export interface TriggerCustomTestSuiteExecutionRequestDto {
  id: string;
}

export interface TriggerCustomTestSuiteExecutionAuthDto {
  jwt: string;
  callerOrganizationId: string;
}

export type TriggerCustomTestSuiteExecutionResponseDto = Result<void>;

export class TriggerCustomTestSuiteExecution
  implements
    IUseCase<
      TriggerCustomTestSuiteExecutionRequestDto,
      TriggerCustomTestSuiteExecutionResponseDto,
      TriggerCustomTestSuiteExecutionAuthDto,
      DbConnection
    >
{
  readonly #readCustomTestSuite: ReadCustomTestSuite;

  readonly #executeTest: ExecuteTest;

  #dbConnection: DbConnection;

  constructor(
    readCustomTestSuite: ReadCustomTestSuite,
    executeTest: ExecuteTest
  ) {
    this.#readCustomTestSuite = readCustomTestSuite;
    this.#executeTest = executeTest;
  }

  async execute(
    request: TriggerCustomTestSuiteExecutionRequestDto,
    auth: TriggerCustomTestSuiteExecutionAuthDto
  ): Promise<TriggerCustomTestSuiteExecutionResponseDto> {
    try {
      const readCustomTestSuiteResult = await this.#readCustomTestSuite.execute(
        { id: request.id },
        { jwt: auth.jwt, callerOrganizationId: auth.callerOrganizationId }
      );

      if (!readCustomTestSuiteResult.success)
        throw new Error(readCustomTestSuiteResult.error);
      if (!readCustomTestSuiteResult.value)
        throw new Error('Reading custom test suite failed');

      const customTestSuite = readCustomTestSuiteResult.value;

      const executeTestResult = await this.#executeTest.execute(
        {
          testSuiteId: customTestSuite.id,
          targetOrganizationId: customTestSuite.organizationId,
          testType: 'Custom',
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
