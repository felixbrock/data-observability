// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadCustomTestSuite } from './read-custom-test-suite';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';
import CitoDataQuery from '../services/cito-data-query';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import { ExecutionType } from '../value-types/execution-type';

export interface TriggerCustomTestSuiteExecutionRequestDto {
  id: string;
  targetOrganizationId?: string;
  executionType: ExecutionType;
}

export interface TriggerCustomTestSuiteExecutionAuthDto {
  jwt: string;
  callerOrganizationId?: string;
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
  readonly #readCustomTestSuite: ReadCustomTestSuite;

  readonly #executeTest: ExecuteTest;

  readonly #querySnowflake: QuerySnowflake;

  #dbConnection: DbConnection;

  constructor(
    readCustomTestSuite: ReadCustomTestSuite,
    executeTest: ExecuteTest,
    querySnowflake: QuerySnowflake
  ) {
    this.#readCustomTestSuite = readCustomTestSuite;
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
    request: TriggerCustomTestSuiteExecutionRequestDto,
    auth: TriggerCustomTestSuiteExecutionAuthDto,
    dbConnection: DbConnection
  ): Promise<TriggerCustomTestSuiteExecutionResponseDto> {
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
      const readCustomTestSuiteResult = await this.#readCustomTestSuite.execute(
        { id: request.id, targetOrganizationId: request.targetOrganizationId },
        {
          jwt: auth.jwt,
          callerOrganizationId: auth.callerOrganizationId,
          isSystemInternal: auth.isSystemInternal,
        }
      );

      if (!readCustomTestSuiteResult.success)
        throw new Error(readCustomTestSuiteResult.error);
      if (!readCustomTestSuiteResult.value)
        throw new Error('Reading custom test suite failed');

      const customTestSuite = readCustomTestSuiteResult.value;

      if (request.executionType === 'automatic') {
        throw new Error('Not implemented yet');
        // if (!request.targetOrganizationId)
        //   throw new Error('TargetorganizationId missing');
        // const wasAltered = !this.#wasAltered(
        //   {
        //     databaseName: customTestSuite.target.databaseName,
        //     schemaName: customTestSuite.target.schemaName,
        //     matName: customTestSuite.target.materializationName,
        //     targetOrganizationId: request.targetOrganizationId,
        //   },
        //   auth.jwt
        // );
        // if (!wasAltered) return Result.ok();
      }

      const executeTestResult = await this.#executeTest.execute(
        {
          testSuiteId: customTestSuite.id,
          testType: 'Custom',
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
