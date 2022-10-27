// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';
import { SnowflakeQueryResultDto } from '../integration-api/snowflake/snowlake-query-result-dto';

interface TestSuiteRepresentation {
  id: string;
  type: string;
  target: {
    databaseName: string;
    schemaName: string;
    materializationName: string;
  };
  organizationId: string;
}

export type TriggerAutomaticExecutionRequestDto = null;

export interface TriggerAutomaticExecutionAuthDto {
  jwt: string;
  isSystemInternal: boolean;
}

export type TriggerAutomaticExecutionResponseDto = Result<void>;

export class TriggerAutomaticExecution
  implements
    IUseCase<
      TriggerAutomaticExecutionRequestDto,
      TriggerAutomaticExecutionResponseDto,
      TriggerAutomaticExecutionAuthDto,
      DbConnection
    >
{
  readonly #querySnowflake: QuerySnowflake;

  readonly #executeTest: ExecuteTest;

  #dbConnection: DbConnection;

  constructor(querySnowflake: QuerySnowflake, executeTest: ExecuteTest) {
    this.#querySnowflake = querySnowflake;
    this.#executeTest = executeTest;
  }

  #getTestSuiteRepresentations = (
    queryResult: SnowflakeQueryResultDto
  ): TestSuiteRepresentation => {
    const representations = Object.keys(queryResult).map((key) => {
      const organizationResult = queryResult[key];

      const organizationTestSuites = organizationResult.map((element): TestSuiteRepresentation => {
        const {
          ID: id,
          TEST_TYPE: type,
          DATABASE_NAME: dbName,
          SCHEMA_NAME: schemaName,
          MATERIALIZATION_NAME: matName,
          ORGANIZATION_ID: orgId,
        } = element;
        if (
          typeof id !== 'string' ||
          typeof type !== 'string' ||
          typeof dbName !== 'string' ||
          typeof schemaName !== 'string' ||
          typeof matName !== 'string' ||
          typeof orgId !== 'string'
        )
          throw new Error('Field type mismatch for retrieved test suites');

        return {
          id,
          type,
          target: {
            databaseName: dbName,
            schemaName,
            materializationName: matName,
          },
          organizationId: orgId,
        };
      });
      return organizationTestSuites;
    });

    return representations.map();
  };

  async execute(
    request: TriggerAutomaticExecutionRequestDto,
    auth: TriggerAutomaticExecutionAuthDto,
    dbConnection: DbConnection
  ): Promise<TriggerAutomaticExecutionResponseDto> {
    if (!auth.isSystemInternal) throw new Error('Unauthorized');

    this.#dbConnection = dbConnection;

    try {
      const query = CitoDataQuery.getReadTestSuitesQuery(
        'test_suites',
        [
          'id',
          'test_type',
          'database_name',
          'schema_name',
          'materialization_name',
        ],
        'activated = true and execution_type = "automated"'
      );

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      const result = querySnowflakeResult.value;

      if (!result) throw new Error(`No test suites found that match condition`);

      const testSuiteRepresentations =
        this.#getTestSuiteRepresentations(result);

      const lastAlteredWhereCondition = org;

      //   Get last altered

      testSuiteRepresentations.map(async (testSuite) => {
        this.#executeTest.execute(
          {
            testSuiteId: testSuite.id,
            testType: testSuite.type,
            targetOrganizationId: testSuite.organizationId,
          },
          { jwt: auth.jwt },
          this.#dbConnection
        );
      });

      const isString = (obj: unknown): obj is string => typeof obj === 'string';

      const failedExecutionErrorMessages = executionResults
        .map((result) => {
          if (!result.result.success)
            return `Execution of test suite ${result.testSuiteId} for organization ${result.organizationId} failed with error msg: ${result.result.error}`;
          return undefined;
        })
        .filter(isString);

      if (failedExecutionErrorMessages.length)
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
