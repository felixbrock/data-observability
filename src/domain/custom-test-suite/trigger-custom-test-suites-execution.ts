// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadCustomTestSuites } from './read-custom-test-suites';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';

export interface TriggerCustomTestSuitesExecutionRequestDto {
  frequency: number;
}

export interface TriggerCustomTestSuitesExecutionAuthDto {
  jwt: string;
  isSystemInternal: boolean;
}

export type TriggerCustomTestSuitesExecutionResponseDto = Result<void>;

export class TriggerCustomTestSuitesExecution
  implements
    IUseCase<
      TriggerCustomTestSuitesExecutionRequestDto,
      TriggerCustomTestSuitesExecutionResponseDto,
      TriggerCustomTestSuitesExecutionAuthDto,
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
    request: TriggerCustomTestSuitesExecutionRequestDto,
    auth: TriggerCustomTestSuitesExecutionAuthDto
  ): Promise<TriggerCustomTestSuitesExecutionResponseDto> {
    if(!auth.isSystemInternal) throw new Error('Unauthorized');

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
        customTestSuites.map(async (el) => {
          const executeTestResult = await this.#executeTest.execute(
            {
              testSuiteId: el.id,
              targetOrganizationId: el.organizationId,
              testType: 'Custom'
            },
            { jwt: auth.jwt },
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
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
