// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import { ReadCustomTestSuite } from './read-custom-test-suite';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';
import { ExecutionType } from '../value-types/execution-type';
import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';

export interface TriggerCustomTestSuiteExecutionRequestDto {
  id: string;
  targetOrgId?: string;
  executionType: ExecutionType;
  profile?: SnowflakeProfileDto;
}

export type TriggerCustomTestSuiteExecutionAuthDto = BaseAuth;

export type TriggerCustomTestSuiteExecutionResponseDto = Result<void>;

export class TriggerCustomTestSuiteExecution implements IUseCase<
  TriggerCustomTestSuiteExecutionRequestDto,
  TriggerCustomTestSuiteExecutionResponseDto,
  TriggerCustomTestSuiteExecutionAuthDto,
  DbConnection
> {
  readonly #repo: ICustomTestSuiteRepo;

  readonly #readCustomTestSuite: ReadCustomTestSuite;

  readonly #executeTest: ExecuteTest;

  #dbConnection: DbConnection;

  constructor(
    repo: ICustomTestSuiteRepo,
    readCustomTestSuite: ReadCustomTestSuite,
    executeTest: ExecuteTest
  ) {
    this.#repo = repo;
    this.#readCustomTestSuite = readCustomTestSuite;
    this.#executeTest = executeTest;
  }

  // #wasAltered = async (
  //   props: {
  //     databaseName: string;
  //     schemaName: string;
  //     matName: string;
  //     targetOrgId: string;
  //   },
  //   jwt: string
  // ): Promise<boolean> => {
  //   const { databaseName, schemaName, matName, targetOrgId } = props;

  //   const query = CitoDataQuery.getWasAltered({
  //     databaseName,
  //     schemaName,
  //     matName,
  //   });

  //   const querySnowflakeResult = await this.#querySnowflake.execute(
  //     { query, targetOrgId },
  //     { jwt }
  //   );

  //   if (!querySnowflakeResult.success)
  //     throw new Error(querySnowflakeResult.error);

  //   const result = querySnowflakeResult.value;

  //   if (!result) throw new Error(`"Was altered" query failed`);

  //   const organizationResults = result[targetOrgId];

  //   if (organizationResults.length !== 1)
  //     throw new Error('No or multiple test suites found');

  //   return organizationResults[0].WAS_ALTERED;
  // };

  async execute(
    request: TriggerCustomTestSuiteExecutionRequestDto,
    auth: TriggerCustomTestSuiteExecutionAuthDto,
    dbConnection: DbConnection
  ): Promise<TriggerCustomTestSuiteExecutionResponseDto> {
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
      const readCustomTestSuiteResult = await this.#readCustomTestSuite.execute(
        { id: request.id, targetOrgId: request.targetOrgId },
        auth
      );

      if (!readCustomTestSuiteResult.success)
        throw new Error(readCustomTestSuiteResult.error);
      if (!readCustomTestSuiteResult.value)
        throw new Error('Reading custom test suite failed');

      const customTestSuite = readCustomTestSuiteResult.value;

      if (request.executionType === 'automatic') {
        throw new Error('Not implemented yet');
        // if (!request.targetOrgId)
        //   throw new Error('targetOrgId missing');
        // const wasAltered = !this.#wasAltered(
        //   {
        //     databaseName: customTestSuite.target.databaseName,
        //     schemaName: customTestSuite.target.schemaName,
        //     matName: customTestSuite.target.materializationName,
        //     targetOrgId: request.targetOrgId,
        //   },
        //   auth.jwt
        // );
        // if (!wasAltered) return Result.ok();
      }

      const executeTestResult = await this.#executeTest.execute(
        {
          testSuiteId: customTestSuite.id,
          testType: 'Custom',
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
