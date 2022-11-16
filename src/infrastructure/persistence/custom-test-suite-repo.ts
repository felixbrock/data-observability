import {
  Auth,
  ICustomTestSuiteRepo,
  CustomTestSuiteUpdateDto,
  CustomTestSuiteQueryDto,
} from '../../domain/custom-test-suite/i-custom-test-suite-repo';
import {
  CustomTestSuite,
  CustomTestSuiteProps,
} from '../../domain/entities/custom-test-suite';
import {
  ColumnDefinition,
  getInsertQuery,
  getUpdateQuery,
  relationPath,
} from './shared/query';
import { QuerySnowflake } from '../../domain/snowflake-api/query-snowflake';
import { SnowflakeEntity } from '../../domain/snowflake-api/i-snowflake-api-repo';
import { SnowflakeProfileDto } from '../../domain/integration-api/i-integration-api-repo';
import BaseSfRepo from './shared/base-sf-repo';
import { parseExecutionType } from '../../domain/value-types/execution-type';

export default class CustomTestSuiteRepo
  extends BaseSfRepo<CustomTestSuite, CustomTestSuiteProps>
  implements ICustomTestSuiteRepo
{
  readonly matName = 'test_suite_custom';

  readonly colDefinitions: ColumnDefinition[] = [
    { name: 'id', nullable: true },
    { name: 'activated', nullable: true },
    { name: 'threshold', nullable: true },
    { name: 'execution_frequency', nullable: true },
    { name: 'name', nullable: true },
    { name: 'description', nullable: true },
    { name: 'sql_logic', nullable: true },
    { name: 'target_resource_ids', selectType: 'parse_json', nullable: true },
    { name: 'organization_id', nullable: true },
    { name: 'cron', nullable: true },
    { name: 'execution_type', nullable: true },
  ];

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(querySnowflake: QuerySnowflake) {
    super(querySnowflake);
  }

  buildEntityProps = (sfEntity: SnowflakeEntity): CustomTestSuiteProps => {
    const {
      ID: id,
      ACTIVATED: activated,
      EXECUTION_FREQUENCY: executionFrequency,
      THRESHOLD: threshold,
      NAME: name,
      DESCRIPTION: description,
      SQL_LOGIC: sqlLogic,
      TARGET_RESOURCE_IDS: targetResourceIds,
      ORGANIZATION_ID: organizationId,
      CRON: cron,
      EXECUTION_TYPE: executionType,
    } = sfEntity;

    if (
      !CustomTestSuiteRepo.isOptionalOfType<string>(id, 'string') ||
      !CustomTestSuiteRepo.isOptionalOfType<boolean>(activated, 'boolean') ||
      !CustomTestSuiteRepo.isOptionalOfType<number>(threshold, 'number') ||
      !CustomTestSuiteRepo.isOptionalOfType<number>(
        executionFrequency,
        'number'
      ) ||
      !CustomTestSuiteRepo.isOptionalOfType<string>(name, 'string') ||
      !CustomTestSuiteRepo.isOptionalOfType<string>(description, 'string') ||
      !CustomTestSuiteRepo.isOptionalOfType<string>(sqlLogic, 'string') ||
      !CustomTestSuiteRepo.isStringArray(targetResourceIds) ||
      !CustomTestSuiteRepo.isOptionalOfType<string>(organizationId, 'string') ||
      !CustomTestSuiteRepo.isOptionalOfType<string>(cron, 'string') ||
      !CustomTestSuiteRepo.isOptionalOfType<string>(executionType, 'string')
    )
      throw new Error(
        'Retrieved unexpected custom test suite field types from persistence'
      );

    return {
      id,
      activated,
      threshold,
      executionFrequency,
      name,
      description,
      sqlLogic,
      targetResourceIds,
      organizationId,
      cron,
      executionType: parseExecutionType(executionType),
    };
  };

  findOne = async (
    id: string,
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<CustomTestSuite | null> => {
    try {
      const queryText = `select * from ${relationPath}.${this.matName}
       where id = ?;`;

      // using binds to tell snowflake to escape params to avoid sql injection attack
      const binds: (string | number)[] = [id];

      const result = await this.querySnowflake.execute(
        { queryText, targetOrgId, binds, profile },
        auth
      );

      if (!result.success) throw new Error(result.error);
      if (!result.value) throw new Error('Missing sf query value');
      if (result.value.length > 1)
        throw new Error(`Multiple customtestsuite entities with id found`);

      return !result.value.length
        ? null
        : this.toEntity(this.buildEntityProps(result.value[0]));
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  findBy = async (
    queryDto: CustomTestSuiteQueryDto,
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<CustomTestSuite[]> => {
    try {
      if (!Object.keys(queryDto).length)
        return await this.all(profile, auth, targetOrgId);

      // using binds to tell snowflake to escape params to avoid sql injection attack
      const binds: (string | number)[] = [];
      let whereClause = '';

      if (queryDto.activated !== undefined) {
        binds.push(queryDto.activated.toString());
        const whereCondition = 'activated = ?';
        whereClause = whereCondition;
      }
      if (queryDto.executionFrequency) {
        binds.push(queryDto.executionFrequency);
        const whereCondition = 'execution_frequency = ?';
        whereClause = whereClause
          ? whereClause.concat(`and ${whereCondition} `)
          : whereCondition;
      }

      const queryText = `select * from ${relationPath}.${this.matName}
          where  ${whereClause};`;

      const result = await this.querySnowflake.execute(
        { queryText, targetOrgId, binds, profile },
        auth
      );

      if (!result.success) throw new Error(result.error);
      if (!result.value) throw new Error('Missing sf query value');

      return result.value.map((el) => this.toEntity(this.buildEntityProps(el)));
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  all = async (
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<CustomTestSuite[]> => {
    try {
      const queryText = `select * from ${relationPath}.${this.matName};`;

      const result = await this.querySnowflake.execute(
        { queryText, targetOrgId, binds: [], profile },
        auth
      );

      if (!result.success) throw new Error(result.error);
      if (!result.value) throw new Error('Missing sf query value');

      return result.value.map((el) => this.toEntity(this.buildEntityProps(el)));
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  getBinds = (entity: CustomTestSuite): (string | number)[] => [
    entity.id,
    entity.activated.toString(),
    entity.threshold,
    entity.executionFrequency,
    entity.name,
    entity.description,
    entity.sqlLogic,
    JSON.stringify(entity.targetResourceIds),
    entity.organizationId,
    entity.cron || 'null',
    entity.executionType,
  ];

  insertOne = async (
    entity: CustomTestSuite,
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<string> => {
    try {
      const binds = this.getBinds(entity);

      const row = `(${binds.map(() => '?').join(', ')})`;

      const queryText = getInsertQuery(this.matName, this.colDefinitions, [
        row,
      ]);

      const result = await this.querySnowflake.execute(
        { queryText, targetOrgId, binds, profile },
        auth
      );

      if (!result.success) throw new Error(result.error);
      if (!result.value) throw new Error('Missing sf query value');

      return entity.id;
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  #getDefinition = (name: string): ColumnDefinition => {
    const def = this.colDefinitions.find((el) => el.name === name);
    if (!def) throw new Error('Missing col definition');

    return def;
  };

  updateOne = async (
    id: string,
    updateDto: CustomTestSuiteUpdateDto,
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<string> => {
    try {
      const colDefinitions: ColumnDefinition[] = [this.#getDefinition('id')];
      const binds = [id];

      if (updateDto.activated !== undefined) {
        colDefinitions.push(this.#getDefinition('activated'));
        binds.push(updateDto.activated.toString());
      }
      if (updateDto.threshold) {
        colDefinitions.push(this.#getDefinition('threshold'));
        binds.push(updateDto.threshold.toString());
      }
      if (updateDto.frequency) {
        colDefinitions.push(this.#getDefinition('execution_frequency'));
        binds.push(updateDto.frequency.toString());
      }
      if (updateDto.name) {
        colDefinitions.push(this.#getDefinition('name'));
        binds.push(updateDto.name.toString());
      }
      if (updateDto.description) {
        colDefinitions.push(this.#getDefinition('description'));
        binds.push(updateDto.description.toString());
      }
      if (updateDto.sqlLogic) {
        colDefinitions.push(this.#getDefinition('sql_logic'));
        binds.push(updateDto.sqlLogic.toString());
      }
      if (updateDto.targetResourceIds) {
        colDefinitions.push(this.#getDefinition('target_resource_ids'));
        binds.push(updateDto.targetResourceIds.toString());
      }
      if (updateDto.cron) {
        colDefinitions.push(this.#getDefinition('cron'));
        binds.push(updateDto.cron.toString());
      }
      if (updateDto.executionType) {
        colDefinitions.push(this.#getDefinition('execution_type'));
        binds.push(updateDto.executionType.toString());
      }

      const queryText = getUpdateQuery(this.matName, colDefinitions, [
        `(${binds.map(() => '?').join(', ')})`,
      ]);

      const result = await this.querySnowflake.execute(
        { queryText, targetOrgId, binds, profile },
        auth
      );

      if (!result.success) throw new Error(result.error);
      if (!result.value) throw new Error('Missing sf query value');

      return id;
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  toEntity = (
    customtestsuiteProperties: CustomTestSuiteProps
  ): CustomTestSuite => CustomTestSuite.create(customtestsuiteProperties);
}
