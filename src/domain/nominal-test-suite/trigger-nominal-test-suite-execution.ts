// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ReadNominalTestSuite } from './read-nominal-test-suite';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';

import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import { ExecutionType } from '../value-types/execution-type';
import { GetSnowflakeProfile } from '../integration-api/get-snowflake-profile';

export interface TriggerNominalTestSuiteExecutionRequestDto {
  id: string;
  targetOrgId?: string;
  executionType: ExecutionType;
}

export interface TriggerNominalTestSuiteExecutionAuthDto {
  jwt: string;
  callerOrgId?: string;
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

  readonly #querySnowflake: QuerySnowflake;

  readonly #getSnowflakeProfile: GetSnowflakeProfile

  #dbConnection: DbConnection;

  constructor(
    readNominalTestSuite: ReadNominalTestSuite,
    executeTest: ExecuteTest,
    querySnowflake: QuerySnowflake,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    this.#readNominalTestSuite = readNominalTestSuite;
    this.#executeTest = executeTest;
    this.#querySnowflake = querySnowflake;
    this.#getSnowflakeProfile = getSnowflakeProfile;
  }

  #wasAltered = async (
    props: {
      databaseName: string;
      schemaName: string;
      matName: string;
      targetOrgId: string;
    },
    jwt: string
  ): Promise<boolean> => {
    const { databaseName, schemaName, matName, targetOrgId } = props;

    const query = CitoDataQuery.getWasAltered({
      databaseName,
      schemaName,
      matName,
    });

    const querySnowflakeResult = await this.#querySnowflake.execute(
      { query, targetOrgId },
      { jwt }
    );

    if (!querySnowflakeResult.success)
      throw new Error(querySnowflakeResult.error);

    const result = querySnowflakeResult.value;

    if (!result) throw new Error(`"Was altered" query failed`);

    const organizationResults = result[targetOrgId];

    if (organizationResults.length !== 1)
      throw new Error('No or multiple test suites found');

    return organizationResults[0].WAS_ALTERED;
  };
  #getProfile = async (
    jwt: string,
    targetOrgId?: string
  ): Promise<SnowflakeProfileDto> => {
    const readSnowflakeProfileResult = await this.#getSnowflakeProfile.execute(
      { targetOrgId },
      {
        jwt,
      }
    );

    if (!readSnowflakeProfileResult.success)
      throw new Error(readSnowflakeProfileResult.error);
    if (!readSnowflakeProfileResult.value)
      throw new Error('SnowflakeProfile does not exist');

    return readSnowflakeProfileResult.value;
  };
  async execute(
    request: TriggerNominalTestSuiteExecutionRequestDto,
    auth: TriggerNominalTestSuiteExecutionAuthDto,
    dbConnection: DbConnection
  ): Promise<TriggerNominalTestSuiteExecutionResponseDto> {
    if (auth.isSystemInternal && !request.targetOrgId)
      throw new Error('Target organization id missing');
    if (!auth.isSystemInternal && !auth.callerOrgId)
      throw new Error('Caller organization id missing');
    if (!request.targetOrgId && !auth.callerOrgId)
      throw new Error('No organization Id provided');
    if (request.executionType === 'automatic' && !request.targetOrgId)
      throw new Error(
        'When automatically executing test suite targetOrgId needs to be provided'
      );

    this.#dbConnection = dbConnection;

    try {
      const readNominalTestSuiteResult =
        await this.#readNominalTestSuite.execute(
          {
            id: request.id,
            targetOrgId: request.targetOrgId,
          },
          {
            jwt: auth.jwt,
            callerOrgId: auth.callerOrgId,
            isSystemInternal: auth.isSystemInternal,
          }
        );

      if (!readNominalTestSuiteResult.success)
        throw new Error(readNominalTestSuiteResult.error);
      if (!readNominalTestSuiteResult.value)
        throw new Error('Reading nominal test suite failed');

      const nominalTestSuite = readNominalTestSuiteResult.value;

      if (request.executionType === 'automatic') {
        if (!request.targetOrgId)
          throw new Error('targetOrgId missing');
        const wasAltered = !this.#wasAltered(
          {
            databaseName: nominalTestSuite.target.databaseName,
            schemaName: nominalTestSuite.target.schemaName,
            matName: nominalTestSuite.target.materializationName,
            targetOrgId: request.targetOrgId,
          },
          auth.jwt
        );
        if (!wasAltered) return Result.ok();
      }

      const executeTestResult = await this.#executeTest.execute(
        {
          testSuiteId: nominalTestSuite.id,
          testType: nominalTestSuite.type,
          targetOrgId: request.targetOrgId,
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
