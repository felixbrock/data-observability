// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadTestSuite } from './read-test-suite';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';
import CitoDataQuery from '../services/cito-data-query';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import { ExecutionType } from '../value-types/execution-type';

export interface TriggerTestSuiteExecutionRequestDto {
  id: string;
  targetOrganizationId?: string;
  executionType: ExecutionType;
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

  readonly #querySnowflake: QuerySnowflake;

  #dbConnection: DbConnection;

  constructor(
    readTestSuite: ReadTestSuite,
    executeTest: ExecuteTest,
    querySnowflake: QuerySnowflake
  ) {
    this.#readTestSuite = readTestSuite;
    this.#executeTest = executeTest;
    this.#querySnowflake = querySnowflake;
  }

  #wasAltered = async (
    props: {
      databaseName: string;
      schemaName: string;
      matName: string;
      targetOrganizationId: string;
    },
    jwt: string
  ): Promise<boolean> => {
    const { databaseName, schemaName, matName, targetOrganizationId } = props;

    const query = CitoDataQuery.getWasAltered({
      databaseName,
      schemaName,
      matName,
    });

    const querySnowflakeResult = await this.#querySnowflake.execute(
      { query, targetOrganizationId },
      { jwt }
    );

    if (!querySnowflakeResult.success)
      throw new Error(querySnowflakeResult.error);

    const result = querySnowflakeResult.value;

    if (!result) throw new Error(`"Was altered" query failed`);

    const organizationResults = result[targetOrganizationId];

    if (organizationResults.length !== 1)
      throw new Error('No or multiple test suites found');

    return organizationResults[0].WAS_ALTERED;
  };

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
    if (request.executionType === 'automatic' && !request.targetOrganizationId)
      throw new Error(
        'When automatically executing test suite targetOrganizationId needs to be provided'
      );

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

      if (request.executionType === 'automatic') {
        if (!request.targetOrganizationId)
          throw new Error('TargetorganizationId missing');
        const wasAltered = !this.#wasAltered(
          {
            databaseName: testSuite.target.databaseName,
            schemaName: testSuite.target.schemaName,
            matName: testSuite.target.materializationName,
            targetOrganizationId: request.targetOrganizationId,
          },
          auth.jwt
        );
        if (!wasAltered) return Result.ok();
      }

      const executeTestResult = await this.#executeTest.execute(
        {
          testSuiteId: testSuite.id,
          testType: testSuite.type,
          targetOrganizationId: request.targetOrganizationId,
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
