// todo - clean architecture violation
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ExecuteTest } from '../test-execution-api/execute-test';
import { DbConnection } from '../services/i-db';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';

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
        ['id', 'test_type', 'database_name', 'schema_name', 'materialization_name'],
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

      const testSuiteRepresentations = Object.keys(result).map((key) => {
        const organizationResult = result[key];

        const organizationTestSuites = organizationResult.map((element) =>
          ({
            id: element.ID,
            type: element.TEST_TYPE,
            target: {
              databaseName: element.DATABASE_NAME,
              schemaName: element.SCHEMA_NAME,
              materializationName: element.MATERIALIZATION_NAME,
            },
            organizationId: element.ORGANIZATION_ID,
          })
        );

        return organizationTestSuites;
      });


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
