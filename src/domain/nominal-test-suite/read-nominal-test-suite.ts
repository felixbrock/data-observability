import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { NominalTestSuite } from '../entities/nominal-test-suite';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';

export interface ReadNominalTestSuiteRequestDto {
  id: string;
}

export interface ReadNominalTestSuiteAuthDto {
  jwt: string;
  callerOrganizationId: string;
}

export type ReadNominalTestSuiteResponseDto = Result<NominalTestSuite>;

export class ReadNominalTestSuite
  implements
    IUseCase<
      ReadNominalTestSuiteRequestDto,
      ReadNominalTestSuiteResponseDto,
      ReadNominalTestSuiteAuthDto
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: ReadNominalTestSuiteRequestDto,
    auth: ReadNominalTestSuiteAuthDto
  ): Promise<ReadNominalTestSuiteResponseDto> {
    try {
      // todo -replace

      const query = CitoDataQuery.getReadTestSuiteQuery([request.id], 'test_suites_nominal');

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      const result = querySnowflakeResult.value;

      if (!result)
        throw new Error(`NominalTestSuite with id ${request.id} does not exist`);

      const organizationResults = result[auth.callerOrganizationId];

      if (organizationResults.length !== 1)
        throw new Error('No or multiple test suites found');

      // if (nominalTestSuite.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(
        NominalTestSuite.create({
          id: organizationResults[0].ID,
          type: organizationResults[0].TEST_TYPE,
          activated: organizationResults[0].ACTIVATED,
          executionFrequency: organizationResults[0].EXECUTION_FREQUENCY,
          target: {
            databaseName: organizationResults[0].DATABASE_NAME,
            schemaName: organizationResults[0].SCHEMA_NAME,
            materializationName: organizationResults[0].MATERIALIZATION_NAME,
            materializationType: organizationResults[0].MATERIALIZATION_TYPE,
            columnName: organizationResults[0].COLUMN_NAME,
            targetResourceId: organizationResults[0].TARGET_RESOURCE_ID,
          },
          organizationId: organizationResults[0].ORGANIZATION_ID,
        })
      );
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}