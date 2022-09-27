import { NominalTestSuite } from '../entities/nominal-test-suite';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';
import { DbConnection } from '../services/i-db';
import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';

export interface ReadNominalTestSuitesRequestDto {
  activated?: boolean;
  executionFrequency?: number;
}

export interface ReadNominalTestSuitesAuthDto {
  jwt: string;
  isSystemInternal: boolean;
  callerOrganizationId?: string;
}

export type ReadNominalTestSuitesResponseDto = Result<NominalTestSuite[]>;

export class ReadNominalTestSuites
  implements
    IUseCase<
      ReadNominalTestSuitesRequestDto,
      ReadNominalTestSuitesResponseDto,
      ReadNominalTestSuitesAuthDto,
      DbConnection
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: ReadNominalTestSuitesRequestDto,
    auth: ReadNominalTestSuitesAuthDto
  ): Promise<ReadNominalTestSuitesResponseDto> {
    if (!auth.isSystemInternal && !auth.callerOrganizationId)
      throw new Error('Not authorized to perform operation');

    try {
      const query = CitoDataQuery.getReadTestSuitesQuery(
        'test_suites_nominal',
        request.executionFrequency,
        request.activated
      );

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      const result = querySnowflakeResult.value;

      if (!result) throw new Error(`No test suites found that match condition`);

      const nominalTestSuites = Object.keys(result).map((key) => {
        const organizationResult = result[key];

        const organizationNominalTestSuites = organizationResult.map((element) =>
          NominalTestSuite.create({
            id: element.ID,
            type: element.TEST_TYPE,
            activated: element.ACTIVATED,
            executionFrequency: element.EXECUTION_FREQUENCY,
            target: {
              databaseName: element.DATABASE_NAME,
              schemaName: element.SCHEMA_NAME,
              materializationName: element.MATERIALIZATION_NAME,
              materializationType: element.MATERIALIZATION_TYPE,
              columnName: element.COLUMN_NAME,
              targetResourceId: element.TARGET_RESOURCE_ID,
            },
            organizationId: element.ORGANIZATION_ID,
          })
        );

        return organizationNominalTestSuites;
      });

      // if (nominalTestSuite.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(nominalTestSuites.flat());
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}