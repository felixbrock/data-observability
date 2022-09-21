// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadCustomTestSuites } from './read-custom-test-suites';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';

export interface TriggerCustomTestSuiteExecutionRequestDto {
  frequency: number;
}

export interface TriggerCustomTestSuiteExecutionAuthDto {
  jwt: string;
  isSystemInternal: boolean;
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
  readonly #readCustomTestSuites: ReadCustomTestSuites;

  readonly #executeTest: ExecuteTest;

  #dbConnection: DbConnection;

  constructor(readCustomTestSuites: ReadCustomTestSuites, executeTest: ExecuteTest) {
    this.#readCustomTestSuites = readCustomTestSuites;
    this.#executeTest = executeTest;
  }

  async execute(
    request: TriggerCustomTestSuiteExecutionRequestDto,
    auth: TriggerCustomTestSuiteExecutionAuthDto
  ): Promise<TriggerCustomTestSuiteExecutionResponseDto> {
    try {
      console.log(`Executing custom test suites with frequency ${request.frequency} h`);

      const readCustomTestSuitesResult = await this.#readCustomTestSuites.execute(
        { executionFrequency: request.frequency, activated: true },
        { jwt: auth.jwt, isSystemInternal: auth.isSystemInternal }
      );

      if (!readCustomTestSuitesResult.success)
        throw new Error(readCustomTestSuitesResult.error);
      if (!readCustomTestSuitesResult.value) throw new Error('Reading jobs failed');
      if (!readCustomTestSuitesResult.value.length) return Result.ok();

      const customTestSuites = readCustomTestSuitesResult.value;

      await Promise.all(
        customTestSuites.map(async (customTestSuite) => {
          const executeTestResult = await this.#executeTest.execute(
            {
              testSuiteId: customTestSuite.id,
              targetOrganizationId: customTestSuite.organizationId,
              testType: 'Custom'
            },
            { jwt: auth.jwt, isSystemInternal: auth.isSystemInternal },
            this.#dbConnection
          );

          if (!executeTestResult.success)
            throw new Error(executeTestResult.error);
        })
      );

      console.log(
        `Finished execution of custom test suites with frequency ${request.frequency}`
      );
      return Result.ok();
    } catch (error: unknown) {
      if (typeof error === 'string') console.trace(error);
      if (error instanceof Error) console.trace(error.message);
      return Result.fail('test execution failed');
    }
  }
}
