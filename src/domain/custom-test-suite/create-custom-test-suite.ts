// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { CustomTestSuite } from '../entities/custom-test-suite';
import CitoDataQuery, { ColumnDefinition } from '../services/cito-data-query';
import { ExecutionType } from '../value-types/execution-type';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';
import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';
import { GetSnowflakeProfile } from '../integration-api/get-snowflake-profile';

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
  profile?: SnowflakeProfileDto;
}

export interface CreateCustomTestSuiteAuthDto {
  jwt: string;
  callerOrgId: string;
  isSystemInternal: boolean;
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

  readonly #getSnowflakeProfile: GetSnowflakeProfile;

  constructor(
    querySnowflake: QuerySnowflake,
    getSnowflakeProfile: GetSnowflakeProfile
  ) {
    this.#querySnowflake = querySnowflake;
    this.#getSnowflakeProfile = getSnowflakeProfile;
  }

  #getProfile = async (
    jwt: string,
    targetOrgId?: string
  ): Promise<SnowflakeProfileDto> => {
    const readSnowflakeProfileResult = await this.#getSnowflakeProfile.execute(
      { targetOrgId },
      {
        jwt,
      }
    );

    if (!readSnowflakeProfileResult.success)
      throw new Error(readSnowflakeProfileResult.error);
    if (!readSnowflakeProfileResult.value)
      throw new Error('SnowflakeProfile does not exist');

    return readSnowflakeProfileResult.value;
  };

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
        organizationId: auth.callerOrgId,
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
        { name: 'execution_type' },
      ];

      const values = [
        `('${customTestSuite.id}',${customTestSuite.activated},${
          customTestSuite.threshold
        },${customTestSuite.executionFrequency},'${customTestSuite.name}','${
          customTestSuite.description
        }','${customTestSuite.sqlLogic}','[${customTestSuite.targetResourceIds
          .map((el) => `'${el}'`)
          .join(',')}]','${customTestSuite.organizationId}', ${
          customTestSuite.cron ? customTestSuite.cron : null
        }, '${customTestSuite.executionType}')`,
      ];

      const profile = request.profile || (await this.#getProfile(auth.jwt));

      const queryText = CitoDataQuery.getInsertQuery(
        'cito.observability.test_suites_custom',
        columnDefinitions,
        values
      );

      const querySnowflakeResult = await this.#querySnowflake.execute(
        { queryText, binds: [], profile },
        auth
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
