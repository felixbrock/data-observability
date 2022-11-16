import Result from '../value-types/transient-types/result';
import { NominalTestSuite } from '../entities/nominal-test-suite';
import CitoDataQuery from '../services/cito-data-query';
import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';
import SfQueryUseCase from '../services/sf-query-use-case';

export interface ReadNominalTestSuiteRequestDto {
  id: string;
  targetOrgId?: string;
  profile?: SnowflakeProfileDto;
}

export interface ReadNominalTestSuiteAuthDto {
  jwt: string;
  callerOrgId?: string;
  isSystemInternal: boolean;
}

export type ReadNominalTestSuiteResponseDto = Result<NominalTestSuite>;

export class ReadNominalTestSuite extends SfQueryUseCase<
  ReadNominalTestSuiteRequestDto,
  ReadNominalTestSuiteResponseDto,
  ReadNominalTestSuiteAuthDto
> {

  async execute(
    request: ReadNominalTestSuiteRequestDto,
    auth: ReadNominalTestSuiteAuthDto
  ): Promise<ReadNominalTestSuiteResponseDto> {
    if (auth.isSystemInternal && !request.targetOrgId)
      throw new Error('Target organization id missing');
    if (!auth.isSystemInternal && !auth.callerOrgId)
      throw new Error('Caller organization id missing');
    if (!request.targetOrgId && !auth.callerOrgId)
      throw new Error('No organization Id provided');

    let organizationId;
    if (auth.isSystemInternal && request.targetOrgId)
      organizationId = request.targetOrgId;
    else if (auth.callerOrgId) organizationId = auth.callerOrgId;
    else throw new Error('Unhandled organizationId allocation');

    try {
      // todo -replace

      const queryText = CitoDataQuery.getReadTestSuiteQuery(
        [request.id],
        'test_suites_nominal'
      );

      const querySnowflakeResult = await this.querySf(
        { queryText, targetOrgId: request.targetOrgId },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      const result = querySnowflakeResult.value;

      if (!result)
        throw new Error(
          `NominalTestSuite with id ${request.id} does not exist`
        );

      const organizationResults = result[organizationId];

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
          cron: organizationResults[0].CRON,
          executionType: organizationResults[0].EXECUTION_TYPE,
        })
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
