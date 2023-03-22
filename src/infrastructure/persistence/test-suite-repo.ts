import {
  parseTestType,
  TestSuite,
  TestSuiteProps,
} from '../../domain/entities/quant-test-suite';
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
import { parseCustomThresholdMode } from '../../domain/value-types/custom-threshold-mode';

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
    { name: 'id', nullable: false },
    { name: 'test_type', nullable: false },
    { name: 'activated', nullable: false },
    { name: 'database_name', nullable: false },
    { name: 'schema_name', nullable: false },
    { name: 'materialization_name', nullable: false },
    { name: 'materialization_type', nullable: false },
    { name: 'column_name', nullable: true },
    { name: 'target_resource_id', nullable: false },
    { name: 'cron', nullable: false },
    { name: 'execution_type', nullable: false },
    { name: 'deleted_at', nullable: true },
    { name: 'custom_lower_threshold', nullable: true },
    {
      name: 'custom_lower_threshold_mode',
      nullable: false,
    },
    { name: 'custom_upper_threshold', nullable: true },
    {
      name: 'custom_upper_threshold_mode',
      nullable: false,
    },
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
      DATABASE_NAME: databaseName,
      SCHEMA_NAME: schemaName,
      MATERIALIZATION_NAME: materializationName,
      MATERIALIZATION_TYPE: materializationType,
      COLUMN_NAME: columnName,
      TARGET_RESOURCE_ID: targetResourceId,
      CRON: cron,
      EXECUTION_TYPE: executionType,
      DELETED_AT: deletedAt,
      CUSTOM_LOWER_THRESHOLD: customLowerThreshold,
      CUSTOM_LOWER_THRESHOLD_MODE: customLowerThresholdMode,
      CUSTOM_UPPER_THRESHOLD: customUpperThreshold,
      CUSTOM_UPPER_THRESHOLD_MODE: customUpperThresholdMode,
    } = sfEntity;

    const isOptionalDateField = (obj: unknown): obj is Date | undefined =>
      !obj || obj instanceof Date;

    if (
      typeof id !== 'string' ||
      typeof type !== 'string' ||
      typeof activated !== 'boolean' ||
      typeof databaseName !== 'string' ||
      typeof schemaName !== 'string' ||
      typeof materializationName !== 'string' ||
      typeof materializationType !== 'string' ||
      !TestSuiteRepo.isOptionalOfType<string>(columnName, 'string') ||
      typeof targetResourceId !== 'string' ||
      typeof cron !== 'string' ||
      typeof executionType !== 'string' ||
      !isOptionalDateField(deletedAt) ||
      !TestSuiteRepo.isOptionalOfType<number>(customUpperThreshold, 'number') ||
      !TestSuiteRepo.isOptionalOfType<number>(customLowerThreshold, 'number')
    )
      throw new Error(
        'Retrieved unexpected test suite field types from persistence'
      );

    return {
      id,
      activated,
      target: {
        databaseName,
        materializationName,
        materializationType: parseMaterializationType(materializationType),
        schemaName,
        targetResourceId,
        columnName,
      },
      type: parseTestType(type),
      cron,
      executionType: parseExecutionType(executionType),
      deletedAt: deletedAt ? deletedAt.toISOString() : undefined,
      customLowerThreshold,
      customLowerThresholdMode: parseCustomThresholdMode(
        customLowerThresholdMode
      ),
      customUpperThreshold,
      customUpperThresholdMode: parseCustomThresholdMode(
        customUpperThresholdMode
      ),
    };
  };

  getBinds = (entity: TestSuite): (string | number)[] => [
    entity.id,
    entity.type,
    entity.activated.toString(),
    entity.target.databaseName,
    entity.target.schemaName,
    entity.target.materializationName,
    entity.target.materializationType,
    entity.target.columnName || 'null',
    entity.target.targetResourceId,
    entity.cron || 'null',
    entity.executionType,
    entity.deletedAt || 'null',
    entity.customLowerThreshold || 'null',
    entity.customLowerThresholdMode,
    entity.customUpperThreshold || 'null',
    entity.customUpperThresholdMode,
  ];

  buildFindByQuery = (queryDto: TestSuiteQueryDto): Query => {
    const binds: (string | number)[] = [];
    let whereClause = `deleted_at is ${queryDto.deleted ? 'not' : ''} null`;

    if (queryDto.activated !== undefined) {
      binds.push(queryDto.activated.toString());
      const whereCondition = 'activated = ?';
      whereClause += ` and ${whereCondition}`;
    }
    if (queryDto.ids && queryDto.ids.length) {
      binds.push(...queryDto.ids);
      const whereCondition = `array_contains(id::variant, array_construct(${queryDto.ids
        .map(() => '?')
        .join(',')}))`;
      whereClause += ` and ${whereCondition}`;
    }
    if (queryDto.targetResourceIds && queryDto.targetResourceIds.length) {
      binds.push(...queryDto.targetResourceIds);
      const whereCondition = `array_contains(target_resource_id::variant, array_construct(${queryDto.targetResourceIds
        .map(() => '?')
        .join(',')}))`;
      whereClause += ` and ${whereCondition}`;
    }

    const text = `select * from ${relationPath}.${this.matName} where ${whereClause};`;

    return { text, binds };
  };

  buildUpdateQuery = (id: string, updateDto: TestSuiteUpdateDto): Query => {
    const colDefinitions: ColumnDefinition[] = [this.getDefinition('id')];
    const binds: Binds = [id];

    if (updateDto.activated !== undefined) {
      colDefinitions.push(this.getDefinition('activated'));
      binds.push(updateDto.activated.toString());
    }
    if (updateDto.cron) {
      colDefinitions.push(this.getDefinition('cron'));
      binds.push(updateDto.cron);
    }
    if (updateDto.executionType) {
      colDefinitions.push(this.getDefinition('execution_type'));
      binds.push(updateDto.executionType);
    }
    if (updateDto.executionType) {
      colDefinitions.push(this.getDefinition('execution_type'));
      binds.push(updateDto.executionType);
    }
    if (updateDto.customLowerThreshold) {
      colDefinitions.push(this.getDefinition('custom_lower_threshold'));
      binds.push(updateDto.customLowerThreshold.value);
      colDefinitions.push(this.getDefinition('custom_lower_threshold_mode'));
      binds.push(updateDto.customLowerThreshold.mode);
    }
    if (updateDto.customUpperThreshold) {
      colDefinitions.push(this.getDefinition('custom_upper_threshold'));
      binds.push(updateDto.customUpperThreshold.value);
      colDefinitions.push(this.getDefinition('custom_upper_threshold_mode'));
      binds.push(updateDto.customUpperThreshold.mode);
    }

    const text = getUpdateQueryText(this.matName, colDefinitions, [
      `(${binds.map(() => '?').join(', ')})`,
    ]);

    return { text, binds, colDefinitions };
  };

  toEntity = (testsuiteProperties: TestSuiteProps): TestSuite =>
    TestSuite.create(testsuiteProperties);
}
