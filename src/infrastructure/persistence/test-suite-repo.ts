import {
  parseTestType,
  TestSuite,
  TestSuiteProps,
} from '../../domain/entities/test-suite';
import {
  ColumnDefinition,
  getUpdateQueryText,
  relationPath,
} from './shared/query';
import { QuerySnowflake } from '../../domain/snowflake-api/query-snowflake';
import {
  Binds,
  SnowflakeEntity,
} from '../../domain/snowflake-api/i-snowflake-api-repo';
import BaseSfRepo, { Query } from './shared/base-sf-repo';
import { parseExecutionType } from '../../domain/value-types/execution-type';
import {
  ITestSuiteRepo,
  TestSuiteQueryDto,
  TestSuiteUpdateDto,
} from '../../domain/test-suite/i-test-suite-repo';
import { parseMaterializationType } from '../../domain/value-types/materialization-type';

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
    { name: 'test_type', nullable: true },
    { name: 'activated', nullable: true },
    { name: 'threshold', nullable: true },
    { name: 'execution_frequency', nullable: true },
    { name: 'database_name', nullable: true },
    { name: 'schema_name', nullable: true },
    { name: 'materialization_name', nullable: true },
    { name: 'materialization_type', nullable: true },
    { name: 'column_name', nullable: true },
    { name: 'target_resource_id', nullable: true },
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
      TEST_TYPE: type,
      ACTIVATED: activated,
      THRESHOLD: threshold,
      EXECUTION_FREQUENCY: executionFrequency,
      DATABASE_NAME: databaseName,
      SCHEMA_NAME: schemaName,
      MATERIALIZATION_NAME: materializationName,
      MATERIALIZATION_TYPE: materializationType,
      COLUMN_NAME: columnName,
      TARGET_RESOURCE_ID: targetResourceId,
      ORGANIZATION_ID: organizationId,
      CRON: cron,
      EXECUTION_TYPE: executionType,
    } = sfEntity;

    if (
      !TestSuiteRepo.isOptionalOfType<string>(id, 'string') ||
      !TestSuiteRepo.isOptionalOfType<string>(type, 'string') ||
      !TestSuiteRepo.isOptionalOfType<boolean>(activated, 'boolean') ||
      !TestSuiteRepo.isOptionalOfType<number>(threshold, 'number') ||
      !TestSuiteRepo.isOptionalOfType<number>(executionFrequency, 'number') ||
      !TestSuiteRepo.isOptionalOfType<string>(databaseName, 'string') ||
      !TestSuiteRepo.isOptionalOfType<string>(schemaName, 'string') ||
      !TestSuiteRepo.isOptionalOfType<string>(materializationName, 'string') ||
      !TestSuiteRepo.isOptionalOfType<string>(materializationType, 'string') ||
      !TestSuiteRepo.isOptionalOfType<string>(columnName, 'string') ||
      !TestSuiteRepo.isOptionalOfType<string>(targetResourceId, 'string') ||
      !TestSuiteRepo.isOptionalOfType<string>(organizationId, 'string') ||
      !TestSuiteRepo.isOptionalOfType<string>(cron, 'string') ||
      !TestSuiteRepo.isOptionalOfType<string>(executionType, 'string')
    )
      throw new Error(
        'Retrieved unexpected test suite field types from persistence'
      );

    return {
      id,
      activated,
      threshold,
      executionFrequency,
      target: {
        databaseName,
        materializationName,
        materializationType: parseMaterializationType(materializationType),
        schemaName,
        targetResourceId,
        columnName,
      },
      type: parseTestType(type),
      organizationId,
      cron,
      executionType: parseExecutionType(executionType),
    };
  };

  getBinds = (entity: TestSuite): (string | number)[] => [
    entity.id,
    entity.type,
    entity.activated.toString(),
    entity.threshold,
    entity.executionFrequency,
    entity.target.databaseName,
    entity.target.schemaName,
    entity.target.materializationName,
    entity.target.materializationType,
    entity.target.columnName || 'null',
    entity.target.targetResourceId,
    entity.organizationId,
    entity.cron || 'null',
    entity.executionType,
  ];

  buildFindByQuery = (queryDto: TestSuiteQueryDto): Query => {
    const binds: (string | number)[] = [];
    let whereClause = '';

    if (queryDto.activated !== undefined) {
      binds.push(queryDto.activated.toString());
      const whereCondition = 'activated = ?';
      whereClause = whereCondition;
    }
    if (queryDto.ids && queryDto.ids.length) {
      binds.push(...queryDto.ids);
      const whereCondition = `array_contains(id::variant, array_construct(${queryDto.ids
        .map(() => '?')
        .join(',')}))`;
      whereClause = whereClause
        ? whereClause.concat(`and ${whereCondition} `)
        : whereCondition;
    }

    const text = `select * from ${relationPath}.${this.matName} ${
      whereClause ? 'where' : ''
    }  ${whereClause};`;

    return { text, binds };
  };

  buildUpdateQuery = (id: string, updateDto: TestSuiteUpdateDto): Query => {
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

  toEntity = (testsuiteProperties: TestSuiteProps): TestSuite =>
    TestSuite.create(testsuiteProperties);
}
