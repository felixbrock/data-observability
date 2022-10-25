// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadNominalTestSuite } from './read-nominal-test-suite';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';

export interface TriggerNominalTestSuiteExecutionRequestDto {
  id: string;
  targetOrganizationId?: string;
}

export interface TriggerNominalTestSuiteExecutionAuthDto {
  jwt: string;
  callerOrganizationId?: string;
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
    auth: TriggerNominalTestSuiteExecutionAuthDto,
    dbConnection: DbConnection
  ): Promise<TriggerNominalTestSuiteExecutionResponseDto> {
    if (auth.isSystemInternal && !request.targetOrganizationId)
      throw new Error('Target organization id missing');
    if (!auth.isSystemInternal && !auth.callerOrganizationId)
      throw new Error('Caller organization id missing');
    if (!request.targetOrganizationId && !auth.callerOrganizationId)
      throw new Error('No organization Id provided');

    this.#dbConnection = dbConnection;

    try {
      const readNominalTestSuiteResult =
        await this.#readNominalTestSuite.execute(
          {
            id: request.id,
            targetOrganizationId: request.targetOrganizationId,
          },
          {
            jwt: auth.jwt,
            callerOrganizationId: auth.callerOrganizationId,
            isSystemInternal: auth.isSystemInternal,
          }
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
