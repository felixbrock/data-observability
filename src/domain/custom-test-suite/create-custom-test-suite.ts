// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { CustomTestSuite } from '../entities/custom-test-suite';
import { QuerySnowflake } from '../integration-api/snowflake/query-snowflake';
import CitoDataQuery, { ColumnDefinition } from '../services/cito-data-query';
import { ExecutionType } from '../value-types/execution-type';

export interface CreateCustomTestSuiteRequestDto {
  activated: boolean;
  threshold: number;
  executionFrequency: number;
  cron?: string;
  executionType: ExecutionType;
  name: string;
  description: string;
  sqlLogic: string;
  targetResourceIds: string[];
}

export interface CreateCustomTestSuiteAuthDto {
  jwt: string;
  callerOrganizationId: string;
}

export type CreateCustomTestSuiteResponseDto = Result<CustomTestSuite>;

export class CreateCustomTestSuite
  implements
    IUseCase<
      CreateCustomTestSuiteRequestDto,
      CreateCustomTestSuiteResponseDto,
      CreateCustomTestSuiteAuthDto
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: CreateCustomTestSuiteRequestDto,
    auth: CreateCustomTestSuiteAuthDto
  ): Promise<CreateCustomTestSuiteResponseDto> {
    try {
      const customTestSuite = CustomTestSuite.create({
        id: new ObjectId().toHexString(),
        name: request.name,
        description: request.description,
        sqlLogic: request.sqlLogic,
        activated: request.activated,
        executionFrequency: request.executionFrequency,
        cron: request.cron,
        executionType: request.executionType,
        organizationId: auth.callerOrganizationId,
        threshold: request.threshold,
        targetResourceIds: request.targetResourceIds,
      });

      const columnDefinitions: ColumnDefinition[] = [
        { name: 'id' },
        { name: 'activated' },
        { name: 'threshold' },
        { name: 'execution_frequency' },
        { name: 'name' },
        { name: 'description' },
        { name: 'sql_logic' },
        { name: 'target_resource_ids', selectType: 'parse_json' },
        { name: 'organization_id' },
        { name: 'cron' },
        {name: 'execution_type'}
      ];

      const values = [
        `('${customTestSuite.id}',${customTestSuite.activated},${
          customTestSuite.threshold
        },${customTestSuite.executionFrequency},'${customTestSuite.name}','${
          customTestSuite.description
        }','${customTestSuite.sqlLogic}','[${customTestSuite.targetResourceIds
          .map((el) => `'${el}'`)
          .join(',')}]','${customTestSuite.organizationId}', ${customTestSuite.cron ? customTestSuite.cron: 'null'}, '${customTestSuite.executionType}')`,
      ];

      const query = CitoDataQuery.getInsertQuery(
        'cito.observability.test_suites_custom',
        columnDefinitions,
        values
      );

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { query },
        { jwt: auth.jwt }
      );

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      return Result.ok(customTestSuite);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
