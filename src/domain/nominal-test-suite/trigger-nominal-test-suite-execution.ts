// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadNominalTestSuite } from './read-nominal-test-suite';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';

export interface TriggerNominalTestSuiteExecutionRequestDto {
  id: string;
}

export interface TriggerNominalTestSuiteExecutionAuthDto {
  jwt: string;
  callerOrganizationId: string;
  
}

export type TriggerNominalTestSuiteExecutionResponseDto = Result<void>;

export class TriggerNominalTestSuiteExecution
  implements
    IUseCase<
      TriggerNominalTestSuiteExecutionRequestDto,
      TriggerNominalTestSuiteExecutionResponseDto,
      TriggerNominalTestSuiteExecutionAuthDto,
      DbConnection
    >
{
  readonly #readNominalTestSuite: ReadNominalTestSuite;

  readonly #executeTest: ExecuteTest;

  #dbConnection: DbConnection;

  constructor(
    readNominalTestSuite: ReadNominalTestSuite,
    executeTest: ExecuteTest
  ) {
    this.#readNominalTestSuite = readNominalTestSuite;
    this.#executeTest = executeTest;
  }

  async execute(
    request: TriggerNominalTestSuiteExecutionRequestDto,
    auth: TriggerNominalTestSuiteExecutionAuthDto
  ): Promise<TriggerNominalTestSuiteExecutionResponseDto> {
    try {
      const readNominalTestSuiteResult =
        await this.#readNominalTestSuite.execute(
          { id: request.id },
          { jwt: auth.jwt, callerOrganizationId: auth.callerOrganizationId }
        );

      if (!readNominalTestSuiteResult.success)
        throw new Error(readNominalTestSuiteResult.error);
      if (!readNominalTestSuiteResult.value)
        throw new Error('Reading nominal test suite failed');

      const nominalTestSuite = readNominalTestSuiteResult.value;

      const executeTestResult = await this.#executeTest.execute(
        {
          testSuiteId: nominalTestSuite.id,
          testType: nominalTestSuite.type,
          targetOrganizationId: nominalTestSuite.organizationId,
        },
        { jwt: auth.jwt },
        this.#dbConnection
      );

      if (!executeTestResult.success) throw new Error(executeTestResult.error);

      return Result.ok();
    } catch (error: unknown) {
      if (typeof error === 'string') console.trace(error);
      if (error instanceof Error) console.trace(error.message);
      return Result.fail('test execution failed');
    }
  }
}
