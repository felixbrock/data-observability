// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import {
  MaterializationType,
  TestSuite,
  TestType,
} from '../entities/test-suite';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery from '../services/cito-data-query';

interface CreateObject {
  activated: boolean;
  type: TestType;
  threshold: number;
  executionFrequency: number;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
  targetResourceId: string;
}

export interface CreateTestSuitesRequestDto {
  createObjects: CreateObject[];
}

export interface CreateTestSuitesAuthDto {
  jwt: string;
  callerOrganizationId: string;
}

export type CreateTestSuitesResponseDto = Result<TestSuite[]>;

export class CreateTestSuites
  implements
    IUseCase<
      CreateTestSuitesRequestDto,
      CreateTestSuitesResponseDto,
      CreateTestSuitesAuthDto
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: CreateTestSuitesRequestDto,
    auth: CreateTestSuitesAuthDto
  ): Promise<CreateTestSuitesResponseDto> {
    try {
      const testSuites = await Promise.all(
        request.createObjects.map(async (createObject) => {
          const testSuite = TestSuite.create({
            id: new ObjectId().toHexString(),
            activated: createObject.activated,
            type: createObject.type,
            threshold: createObject.threshold,
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
          });

          const query = CitoDataQuery.getInsertTestSuiteQuery(testSuite);

          const querySnowflakeResult = await this.#querySnowflake.execute(
            { query },
            { jwt: auth.jwt }
          );

          if (!querySnowflakeResult.success)
            throw new Error(querySnowflakeResult.error);

          return testSuite;
        })
      );

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
