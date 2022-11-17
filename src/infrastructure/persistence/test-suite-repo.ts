import {
  TestSuiteUpdateDto,
  TestSuiteQueryDto,
  ITestSuiteRepo,
} from '../../domain/test-suite/i-test-suite-repo';
import { TestSuite, TestSuiteProps } from '../../domain/entities/test-suite';
import {
  ColumnDefinition,
  getUpdateQueryText,
  relationPath,
} from './shared/query';
import { QuerySnowflake } from '../../domain/snowflake-api/query-snowflake';
import { SnowflakeEntity } from '../../domain/snowflake-api/i-snowflake-api-repo';
import BaseSfRepo, { Query } from './shared/base-sf-repo';
import { parseExecutionType } from '../../domain/value-types/execution-type';

export default class TestSuiteRepo
  extends BaseSfRepo<
    TestSuite,
    TestSuiteProps,
    TestSuiteQueryDto,
    TestSuiteUpdateDto
  >
  implements ITestSuiteRepo
{
  readonly matName = 'test_suites';

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

  buildEntityProps = (sfEntity: SnowflakeEntity): TestSuiteProps => {
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
      !TestSuiteRepo.isOptionalOfType<string>(id, 'string') ||
      !TestSuiteRepo.isOptionalOfType<boolean>(activated, 'boolean') ||
      !TestSuiteRepo.isOptionalOfType<number>(threshold, 'number') ||
      !TestSuiteRepo.isOptionalOfType<number>(executionFrequency, 'number') ||
      !TestSuiteRepo.isOptionalOfType<string>(name, 'string') ||
      !TestSuiteRepo.isOptionalOfType<string>(description, 'string') ||
      !TestSuiteRepo.isOptionalOfType<string>(sqlLogic, 'string') ||
      !TestSuiteRepo.isStringArray(targetResourceIds) ||
      !TestSuiteRepo.isOptionalOfType<string>(organizationId, 'string') ||
      !TestSuiteRepo.isOptionalOfType<string>(cron, 'string') ||
      !TestSuiteRepo.isOptionalOfType<string>(executionType, 'string')
    )
      throw new Error(
        'Retrieved unexpected  test suite field types from persistence'
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

  buildFindByQuery = (queryDto: TestSuiteQueryDto): Query => {
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
        where  ${whereClause};`;

    return { text, binds };
  };

  getBinds = (entity: TestSuite): (string | number)[] => [
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

  buildUpdateQuery = (id: string, updateDto: TestSuiteUpdateDto): Query => {
    const colDefinitions: ColumnDefinition[] = [this.getDefinition('id')];
    const binds = [id];

    if (updateDto.activated !== undefined) {
      colDefinitions.push(this.getDefinition('activated'));
      binds.push(updateDto.activated.toString());
    }
    if (updateDto.threshold) {
      colDefinitions.push(this.getDefinition('threshold'));
      binds.push(updateDto.threshold.toString());
    }
    if (updateDto.frequency) {
      colDefinitions.push(this.getDefinition('execution_frequency'));
      binds.push(updateDto.frequency.toString());
    }
    if (updateDto.name) {
      colDefinitions.push(this.getDefinition('name'));
      binds.push(updateDto.name.toString());
    }
    if (updateDto.description) {
      colDefinitions.push(this.getDefinition('description'));
      binds.push(updateDto.description.toString());
    }
    if (updateDto.sqlLogic) {
      colDefinitions.push(this.getDefinition('sql_logic'));
      binds.push(updateDto.sqlLogic.toString());
    }
    if (updateDto.targetResourceIds) {
      colDefinitions.push(this.getDefinition('target_resource_ids'));
      binds.push(updateDto.targetResourceIds.toString());
    }
    if (updateDto.cron) {
      colDefinitions.push(this.getDefinition('cron'));
      binds.push(updateDto.cron.toString());
    }
    if (updateDto.executionType) {
      colDefinitions.push(this.getDefinition('execution_type'));
      binds.push(updateDto.executionType.toString());
    }

    const text = getUpdateQueryText(this.matName, colDefinitions, [
      `(${binds.map(() => '?').join(', ')})`,
    ]);

    return { text, binds, colDefinitions };
  };

  toEntity = (testsuiteProperties: TestSuiteProps): TestSuite =>
    TestSuite.create(testsuiteProperties);
}
