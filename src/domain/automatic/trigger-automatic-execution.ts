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

  #jwt?: string;

  automaticExecutionFrequency = 5;

  constructor(querySnowflake: QuerySnowflake, executeTest: ExecuteTest) {
    this.#querySnowflake = querySnowflake;
    this.#executeTest = executeTest;
  }

  #getTestSuiteRepresentations = (
    queryResult: SnowflakeQueryResultDto
  ): TestSuiteRepresentation[][] => {
    const representations = Object.keys(queryResult).map((orgId) => {
      const organizationResult = queryResult[orgId];

      const organizationTestSuites = organizationResult.map(
        (element): TestSuiteRepresentation => {
          const {
            ID: id,
            TEST_TYPE: type,
            DATABASE_NAME: dbName,
            SCHEMA_NAME: schemaName,
            MATERIALIZATION_NAME: matName,
            ORGANIZATION_ID: organizationId,
          } = element;
          if (
            typeof id !== 'string' ||
            typeof type !== 'string' ||
            typeof dbName !== 'string' ||
            typeof schemaName !== 'string' ||
            typeof matName !== 'string' ||
            typeof organizationId !== 'string'
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
            organizationId,
          };
        }
      );

      if (!organizationTestSuites.length)
        console.warn(`Organization with id ${orgId} has no tests defined`);

      return organizationTestSuites;
    });

    return representations;
  };

  #buildAlteredQuery = (representations: TestSuiteRepresentation[]): string => {
    if (!representations.length)
      throw new Error('Provided representation property cannot be empty');

    const tableMatchingWhereElement = representations
      .map(
        (el) =>
          `(
                  table_catalog = "${el.target.databaseName}" 
                  and table_schema = "${el.target.schemaName}" 
                  and table_name = "${el.target.materializationName}"
                )`
      )
      .join(' or ');

    // todo - get last test execution time
    const alteredWhereElement = `timediff(minute, last_altered, current_timestamp::timestamp_ntz) > ${this.automaticExecutionFrequency}`;

    const whereStatement = `(${tableMatchingWhereElement}) and (${alteredWhereElement})`;

    return `select table_catalog, table_schema, table_name from ${representations}.information_schema.tables
      where ${whereStatement};`;
  };

  #queryAlteredTableInfo = async (
    query: string,
    targetOrganizationId: string
  ): Promise<
    { TABLE_CATALOG: string; TABLE_SCHEMA: string; TABLE_NAME: string }[]
  > => {
    if (!this.#jwt) throw new Error('Missing jwt');

    const queryResult = await this.#querySnowflake.execute(
      { query, targetOrganizationId },
      { jwt: this.#jwt }
    );

    if (!queryResult.success) throw new Error(queryResult.error);
    if (!queryResult.value)
      throw new Error(
        'Unexpected error when querying for altered table info - missing result value'
      );

    const result = queryResult.value;

    if (!(targetOrganizationId in result))
      throw new Error(
        `No query result for organization ${targetOrganizationId} returned`
      );

    return result[targetOrganizationId].map((el) => ({
      TABLE_CATALOG: el.TABLE_CATALOG,
      TABLE_SCHEMA: el.TABLE_SCHEMA,
      TABLE_NAME: el.TABLE_NAME,
    }));
  };

  #handleDbGroupedRepresentations = async (
    representations: TestSuiteRepresentation[]
  ): Promise<void> => {
    const jwt = this.#jwt;
    if (!jwt) throw new Error('Missing jwt');

    const query = this.#buildAlteredQuery(representations);

    const alteredMats = await this.#queryAlteredTableInfo(
      query,
      representations[0].organizationId
    );

    const testSuitesToTest = representations.filter(
      (representation) =>
        alteredMats.findIndex(
          (el) =>
            el.TABLE_CATALOG === representation.target.databaseName &&
            el.TABLE_SCHEMA === representation.target.schemaName &&
            el.TABLE_NAME === representation.target.materializationName
        ) !== -1
    );

    /* 
    Not awaited to avoid lambda function timeout
    */
    testSuitesToTest.forEach((el) =>
      this.#executeTest.execute(
        {
          testSuiteId: el.id,
          testType: el.type,
          targetOrganizationId: el.organizationId,
        },
        { jwt },
        this.#dbConnection
      )
    );
  };

  #groupByDb = (
    accumulation: { [key: string]: TestSuiteRepresentation[] },
    representation: TestSuiteRepresentation
  ): { [key: string]: TestSuiteRepresentation[] } => {
    const localAcc = accumulation;

    const { databaseName } = representation.target;
    if (databaseName in localAcc) localAcc[databaseName].push(representation);
    else localAcc[databaseName] = [representation];

    return localAcc;
  };

  #handleOrgTestSuiteRepresentations = async (
    representations: TestSuiteRepresentation[]
  ): Promise<void> => {
    const representationsByDatabaseName = representations.reduce(
      this.#groupByDb,
      {}
    );

    await Promise.all(
      Object.keys(representationsByDatabaseName).map(async (key) => {
        await this.#handleDbGroupedRepresentations(
          representationsByDatabaseName[key]
        );
      })
    );
  };

  async execute(
    request: TriggerAutomaticExecutionRequestDto,
    auth: TriggerAutomaticExecutionAuthDto,
    dbConnection: DbConnection
  ): Promise<TriggerAutomaticExecutionResponseDto> {
    if (!auth.isSystemInternal) throw new Error('Unauthorized');

    this.#jwt = auth.jwt;

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

      await Promise.all(
        testSuiteRepresentations.map(async (representationsPerOrg) => {
          await this.#handleOrgTestSuiteRepresentations(representationsPerOrg);
        })
      );

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
