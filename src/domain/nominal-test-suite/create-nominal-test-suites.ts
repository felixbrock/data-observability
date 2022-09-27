// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import {
  MaterializationType,
  NominalTestSuite,
  NominalTestType,
} from '../entities/nominal-test-suite';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery, { ColumnDefinition } from '../services/cito-data-query';

interface CreateObject {
  activated: boolean;
  type: NominalTestType;
  threshold: number;
  executionFrequency: number;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
  targetResourceId: string;
}

export interface CreateNominalTestSuitesRequestDto {
  createObjects: CreateObject[];
}

export interface CreateNominalTestSuitesAuthDto {
  jwt: string;
  callerOrganizationId: string;
}

export type CreateNominalTestSuitesResponseDto = Result<NominalTestSuite[]>;

export class CreateNominalTestSuites
  implements
    IUseCase<
      CreateNominalTestSuitesRequestDto,
      CreateNominalTestSuitesResponseDto,
      CreateNominalTestSuitesAuthDto
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: CreateNominalTestSuitesRequestDto,
    auth: CreateNominalTestSuitesAuthDto
  ): Promise<CreateNominalTestSuitesResponseDto> {
    try {
      const nominalTestSuites = request.createObjects.map((createObject) =>
        NominalTestSuite.create({
          id: new ObjectId().toHexString(),
          activated: createObject.activated,
          type: createObject.type,
          executionFrequency: createObject.executionFrequency,
          target: {
            databaseName: createObject.databaseName,
            schemaName: createObject.schemaName,
            materializationName: createObject.materializationName,
            materializationType: createObject.materializationType,
            columnName: createObject.columnName,
            targetResourceId: createObject.targetResourceId,
          },
          organizationId: auth.callerOrganizationId,
        })
      );

      const columnDefinitions: ColumnDefinition[] = [
        { name: 'id' },
        { name: 'test_type' },
        { name: 'activated' },
        { name: 'execution_frequency' },
        { name: 'database_name' },
        { name: 'schema_name' },
        { name: 'materialization_name' },
        { name: 'materialization_type' },
        { name: 'column_name' },
        { name: 'target_resource_id' },
        { name: 'organization_id' },
        { name: 'cron' },
      ];

      const values = nominalTestSuites.map(
        (el) =>
          `('${el.id}','${el.type}',${el.activated},${
            el.executionFrequency
          },'${el.target.databaseName}','${el.target.schemaName}','${
            el.target.materializationName
          }','${el.target.materializationType}','${
            el.target.columnName ? el.target.columnName : null
          }','${el.target.targetResourceId}','${el.organizationId}', null)`
      );

      const query = CitoDataQuery.getInsertQuery(
        'cito.public.test_suites_nominal',
        columnDefinitions,
        values
      );
     
      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      return Result.ok(nominalTestSuites);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}