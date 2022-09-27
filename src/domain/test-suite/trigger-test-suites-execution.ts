// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadTestSuites } from './read-test-suites';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';

export interface TriggerTestSuitesExecutionRequestDto {
  frequency: number;
}

export interface TriggerTestSuitesExecutionAuthDto {
  jwt: string;
  isSystemInternal: boolean;
}

export type TriggerTestSuitesExecutionResponseDto = Result<void>;

export class TriggerTestSuitesExecution
  implements
    IUseCase<
      TriggerTestSuitesExecutionRequestDto,
      TriggerTestSuitesExecutionResponseDto,
      TriggerTestSuitesExecutionAuthDto,
      DbConnection
    >
{
  readonly #readTestSuites: ReadTestSuites;

  readonly #executeTest: ExecuteTest;

  #dbConnection: DbConnection;

  constructor(readTestSuites: ReadTestSuites, executeTest: ExecuteTest) {
    this.#readTestSuites = readTestSuites;
    this.#executeTest = executeTest;
  }

  async execute(
    request: TriggerTestSuitesExecutionRequestDto,
    auth: TriggerTestSuitesExecutionAuthDto
  ): Promise<TriggerTestSuitesExecutionResponseDto> {
    if(!auth.isSystemInternal) throw new Error('Unauthorized');

    try {
      console.log(`Executing test suites with frequency ${request.frequency} h`);

      const readTestSuitesResult = await this.#readTestSuites.execute(
        { executionFrequency: request.frequency, activated: true },
        { jwt: auth.jwt, isSystemInternal: auth.isSystemInternal }
      );

      if (!readTestSuitesResult.success)
        throw new Error(readTestSuitesResult.error);
      if (!readTestSuitesResult.value) throw new Error('Reading jobs failed');
      if (!readTestSuitesResult.value.length) return Result.ok();

      const testSuites = readTestSuitesResult.value;

      await Promise.all(
        testSuites.map(async (testSuite) => {
          const executeTestResult = await this.#executeTest.execute(
            {
              testSuiteId: testSuite.id,
              testType: testSuite.type,
              targetOrganizationId: testSuite.organizationId,
            },
            { jwt: auth.jwt },
            this.#dbConnection
          );

          if (!executeTestResult.success)
            throw new Error(executeTestResult.error);
        })
      );

      console.log(
        `Finished execution of test suites with frequency ${request.frequency}`
      );
      return Result.ok();
    } catch (error: unknown) {
      if (typeof error === 'string') console.trace(error);
      if (error instanceof Error) console.trace(error.message);
      return Result.fail('test execution failed');
    }
  }
}
