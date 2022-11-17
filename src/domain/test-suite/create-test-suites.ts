// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import { TestSuite, TestType } from '../entities/test-suite';

import { MaterializationType } from '../value-types/materialization-type';
import { ExecutionType } from '../value-types/execution-type';
import { GetSnowflakeProfile } from '../integration-api/get-snowflake-profile';
import BaseSfQueryUseCase from '../services/base-sf-query-use-case';
import { ITestSuiteRepo } from './test-suite-repo';
import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';
import BaseAuth from '../services/base-auth';

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
  cron?: string;
  executionType: ExecutionType;
}

export interface CreateTestSuitesRequestDto {
  createObjects: CreateObject[];
  profile?: SnowflakeProfileDto;
}

export interface CreateTestSuitesAuthDto extends Omit<BaseAuth, 'callerOrgId'>{
  callerOrgId: string;
};

export type CreateTestSuitesResponseDto = Result<TestSuite[]>;

export class CreateTestSuites
  extends BaseSfQueryUseCase<
      CreateTestSuitesRequestDto,
      CreateTestSuitesResponseDto,
      CreateTestSuitesAuthDto
    >
{

  readonly #repo:  ITestSuiteRepo;

  constructor(
    getSnowflakeProfile: GetSnowflakeProfile, repo: ITestSuiteRepo
  ) {
    super(getSnowflakeProfile);
    this.#repo = repo;
  }

  async execute(
    request: CreateTestSuitesRequestDto,
    auth: CreateTestSuitesAuthDto
  ): Promise<CreateTestSuitesResponseDto> {
    try {
      const testSuites = request.createObjects.map((el) =>
        TestSuite.create({
          id: new ObjectId().toHexString(),
          activated: el.activated,
          type: el.type,
          threshold: el.threshold,
          executionFrequency: el.executionFrequency,
          target: {
            databaseName: el.databaseName,
            schemaName: el.schemaName,
            materializationName: el.materializationName,
            materializationType: el.materializationType,
            columnName: el.columnName,
            targetResourceId: el.targetResourceId,
          },
          organizationId: auth.callerOrgId  ,
          cron: el.cron,
          executionType: el.executionType,
        })
      );

      const profile = request.profile || (await this.getProfile(auth.jwt));

      await this.#repo.insertMany(testSuites, profile, auth);

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}

      const columnDefinitions: ColumnDefinition[] = [
        { name: 'id' },
        { name: 'test_type' },
        { name: 'activated' },
        { name: 'threshold' },
        { name: 'execution_frequency' },
        { name: 'database_name' },
        { name: 'schema_name' },
        { name: 'materialization_name' },
        { name: 'materialization_type' },
        { name: 'column_name' },
        { name: 'target_resource_id' },
        { name: 'organization_id' },
        { name: 'cron' },
        { name: 'execution_type' },
      ];

      const values = testSuites.map(
        (el) =>
          `('${el.id}','${el.type}',${el.activated},${el.threshold},${
            el.executionFrequency
          },'${el.target.databaseName}','${el.target.schemaName}','${
            el.target.materializationName
          }','${el.target.materializationType}','${
            el.target.columnName ? el.target.columnName : null
          }','${el.target.targetResourceId}','${el.organizationId}', ${
            el.cron || null
          }, '${el.executionType}')`
      );

      const query = CitoDataQuery.getInsertQuery(
        'cito.observability.test_suites',
        columnDefinitions,
        values
      );

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
