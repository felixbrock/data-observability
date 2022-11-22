import {
  CustomTestSuiteUpdateDto,
  CustomTestSuiteQueryDto,
  ICustomTestSuiteRepo,
} from '../../domain/custom-test-suite/i-custom-test-suite-repo';
import {
  CustomTestSuite,
  CustomTestSuiteProps,
} from '../../domain/entities/custom-test-suite';
import {
  ColumnDefinition,
  getUpdateQueryText,
  relationPath,
} from './shared/query';
import { QuerySnowflake } from '../../domain/snowflake-api/query-snowflake';
import { Binds, SnowflakeEntity } from '../../domain/snowflake-api/i-snowflake-api-repo';
import BaseSfRepo, { Query } from './shared/base-sf-repo';
import { parseExecutionType } from '../../domain/value-types/execution-type';

export default class CustomTestSuiteRepo
  extends BaseSfRepo<
    CustomTestSuite,
    CustomTestSuiteProps,
    CustomTestSuiteQueryDto,
    CustomTestSuiteUpdateDto
  >
  implements ICustomTestSuiteRepo
{
  readonly matName = 'test_suites_custom';

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

  buildFindByQuery = (queryDto: CustomTestSuiteQueryDto): Query => {
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

    const text = `select * from ${relationPath}.${this.matName}
    ${whereClause ? 'where' : ''}  ${whereClause};`;

    return { text, binds };
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

  buildUpdateQuery = (
    id: string,
    updateDto: CustomTestSuiteUpdateDto
  ): Query => {
    const colDefinitions: ColumnDefinition[] = [this.getDefinition('id')];
    const binds: Binds = [id];

    if (updateDto.activated !== undefined) {
      colDefinitions.push(this.getDefinition('activated'));
      binds.push(updateDto.activated.toString());
    }
    if (updateDto.threshold) {
      colDefinitions.push(this.getDefinition('threshold'));
      binds.push(updateDto.threshold);
    }
    if (updateDto.frequency) {
      colDefinitions.push(this.getDefinition('execution_frequency'));
      binds.push(updateDto.frequency);
    }
    if (updateDto.name) {
      colDefinitions.push(this.getDefinition('name'));
      binds.push(updateDto.name);
    }
    if (updateDto.description) {
      colDefinitions.push(this.getDefinition('description'));
      binds.push(updateDto.description);
    }
    if (updateDto.sqlLogic) {
      colDefinitions.push(this.getDefinition('sql_logic'));
      binds.push(updateDto.sqlLogic);
    }
    if (updateDto.targetResourceIds) {
      colDefinitions.push(this.getDefinition('target_resource_ids'));
      binds.push(JSON.stringify(updateDto.targetResourceIds));
    }
    if (updateDto.cron) {
      colDefinitions.push(this.getDefinition('cron'));
      binds.push(updateDto.cron);
    }
    if (updateDto.executionType) {
      colDefinitions.push(this.getDefinition('execution_type'));
      binds.push(updateDto.executionType);
    }

    const text = getUpdateQueryText(this.matName, colDefinitions, [
      `(${binds.map(() => '?').join(', ')})`,
    ]);

    return { text, binds, colDefinitions };
  };

  toEntity = (
    customtestsuiteProperties: CustomTestSuiteProps
  ): CustomTestSuite => CustomTestSuite.create(customtestsuiteProperties);
}
