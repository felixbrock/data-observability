// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadNominalTestSuites } from './read-nominal-test-suites';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';

export interface TriggerNominalTestSuiteExecutionRequestDto {
  frequency: number;
}

export interface TriggerNominalTestSuiteExecutionAuthDto {
  jwt: string;
  isSystemInternal: boolean;
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
  readonly #readNominalTestSuites: ReadNominalTestSuites;

  readonly #executeTest: ExecuteTest;

  #dbConnection: DbConnection;

  constructor(readNominalTestSuites: ReadNominalTestSuites, executeTest: ExecuteTest) {
    this.#readNominalTestSuites = readNominalTestSuites;
    this.#executeTest = executeTest;
  }

  async execute(
    request: TriggerNominalTestSuiteExecutionRequestDto,
    auth: TriggerNominalTestSuiteExecutionAuthDto
  ): Promise<TriggerNominalTestSuiteExecutionResponseDto> {
    try {
      console.log(`Executing tets suites with frequency ${request.frequency} h`);

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
            { jwt: auth.jwt, isSystemInternal: auth.isSystemInternal },
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
