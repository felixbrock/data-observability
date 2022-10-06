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
    if (!auth.isSystemInternal) throw new Error('Unauthorized');

    try {
      console.log(
        `Executing test suites with frequency ${request.frequency} h`
      );

      const readTestSuitesResult = await this.#readTestSuites.execute(
        { executionFrequency: request.frequency, activated: true },
        { jwt: auth.jwt, isSystemInternal: auth.isSystemInternal }
      );

      if (!readTestSuitesResult.success)
        throw new Error(readTestSuitesResult.error);
      if (!readTestSuitesResult.value) throw new Error('Reading jobs failed');
      if (!readTestSuitesResult.value.length) return Result.ok();

      const testSuites = readTestSuitesResult.value;

      const executionResults = await Promise.all(
        testSuites.map(async (testSuite) => {
          const result = await this.#executeTest.execute(
            {
              testSuiteId: testSuite.id,
              testType: testSuite.type,
              targetOrganizationId: testSuite.organizationId,
            },
            { jwt: auth.jwt },
            this.#dbConnection
          );

          return {
            testSuiteId: testSuite.id,
            organizationId: testSuite.organizationId,
            result,
          };
        })
      );

      const isString = (obj: unknown): obj is string => typeof obj === 'string';

      const failedExecutionErrorMessages = executionResults
        .map((result) => {
          if (!result.result.success)
            return `Execution of test suite ${result.testSuiteId} for organization ${result.organizationId} failed with error msg: ${result.result.error}`;
          return undefined;
        })
        .filter(isString);

      if(failedExecutionErrorMessages.length)
        console.error(failedExecutionErrorMessages.join());

      console.log(
        `Finished execution of test suites with frequency ${request.frequency}`
      );
      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
