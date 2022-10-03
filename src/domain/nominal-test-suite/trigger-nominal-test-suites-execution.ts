// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadNominalTestSuites } from './read-nominal-test-suites';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';

export interface TriggerNominalTestSuitesExecutionRequestDto {
  frequency: number;
}

export interface TriggerNominalTestSuitesExecutionAuthDto {
  jwt: string;
  isSystemInternal: boolean;
}

export type TriggerNominalTestSuitesExecutionResponseDto = Result<void>;

export class TriggerNominalTestSuitesExecution
  implements
    IUseCase<
      TriggerNominalTestSuitesExecutionRequestDto,
      TriggerNominalTestSuitesExecutionResponseDto,
      TriggerNominalTestSuitesExecutionAuthDto,
      DbConnection
    >
{
  readonly #readNominalTestSuites: ReadNominalTestSuites;

  readonly #executeTest: ExecuteTest;

  #dbConnection: DbConnection;

  constructor(readNominalTestSuites: ReadNominalTestSuites, executeTest: ExecuteTest) {
    this.#readNominalTestSuites = readNominalTestSuites;
    this.#executeTest = executeTest;
  }

  async execute(
    request: TriggerNominalTestSuitesExecutionRequestDto,
    auth: TriggerNominalTestSuitesExecutionAuthDto
  ): Promise<TriggerNominalTestSuitesExecutionResponseDto> {
    if(!auth.isSystemInternal) throw new Error('Unauthorized');

    try {
      console.log(`Executing test suites with frequency ${request.frequency} h`);

      const readNominalTestSuitesResult = await this.#readNominalTestSuites.execute(
        { executionFrequency: request.frequency, activated: true },
        { jwt: auth.jwt, isSystemInternal: auth.isSystemInternal }
      );

      if (!readNominalTestSuitesResult.success)
        throw new Error(readNominalTestSuitesResult.error);
      if (!readNominalTestSuitesResult.value) throw new Error('Reading jobs failed');
      if (!readNominalTestSuitesResult.value.length) return Result.ok();

      const nominalTestSuites = readNominalTestSuitesResult.value;

      await Promise.all(
        nominalTestSuites.map(async (nominalTestSuite) => {
          const executeTestResult = await this.#executeTest.execute(
            {
              testSuiteId: nominalTestSuite.id,
              testType: nominalTestSuite.type,
              targetOrganizationId: nominalTestSuite.organizationId,
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
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
