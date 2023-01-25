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
    { name: 'threshold', nullable: false },
    { name: 'database_name', nullable: false },
    { name: 'schema_name', nullable: false },
    { name: 'materialization_name', nullable: false },
    { name: 'materialization_type', nullable: false },
    { name: 'column_name', nullable: true },
    { name: 'target_resource_id', nullable: false },
    { name: 'cron', nullable: false },
    { name: 'execution_type', nullable: false },
    { name: 'importance_threshold', nullable: false },
    { name: 'bounds_interval_relative', nullable: false },
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
      DATABASE_NAME: databaseName,
      SCHEMA_NAME: schemaName,
      MATERIALIZATION_NAME: materializationName,
      MATERIALIZATION_TYPE: materializationType,
      COLUMN_NAME: columnName,
      TARGET_RESOURCE_ID: targetResourceId,
      CRON: cron,
      EXECUTION_TYPE: executionType,
      IMPORTANCE_THRESHOLD: importanceThreshold,
      BOUNDS_INTERVAL_RELATIVE: boundsIntervalRelative,
    } = sfEntity;

    if (
      typeof id !== 'string' ||
      typeof type !== 'string' ||
      typeof activated !== 'boolean' ||
      typeof threshold !== 'number' ||
      typeof databaseName !== 'string' ||
      typeof schemaName !== 'string' ||
      typeof materializationName !== 'string' ||
      typeof materializationType !== 'string' ||
      !TestSuiteRepo.isOptionalOfType<string>(columnName, 'string') ||
      typeof targetResourceId !== 'string' ||
      typeof cron !== 'string' ||
      typeof executionType !== 'string' ||
      typeof importanceThreshold !== 'number' ||
      typeof boundsIntervalRelative !== 'number'
    )
      throw new Error(
        'Retrieved unexpected test suite field types from persistence'
      );

    return {
      id,
      activated,
      threshold,
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
      importanceThreshold,
      boundsIntervalRelative,
    };
  };

  getBinds = (entity: TestSuite): (string | number)[] => [
    entity.id,
    entity.type,
    entity.activated.toString(),
    entity.threshold,
    entity.target.databaseName,
    entity.target.schemaName,
    entity.target.materializationName,
    entity.target.materializationType,
    entity.target.columnName || 'null',
    entity.target.targetResourceId,
    entity.cron || 'null',
    entity.executionType,
    entity.importanceThreshold,
    entity.boundsIntervalRelative,
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
    if (updateDto.importanceThreshold) {
      colDefinitions.push(this.getDefinition('importance_threshold'));
      binds.push(updateDto.importanceThreshold);
    }
    if (updateDto.boundsIntervalRelative) {
      colDefinitions.push(this.getDefinition('bounds_interval_relative'));
      binds.push(updateDto.boundsIntervalRelative);
    }

    const text = getUpdateQueryText(this.matName, colDefinitions, [
      `(${binds.map(() => '?').join(', ')})`,
    ]);

    return { text, binds, colDefinitions };
  };

  toEntity = (testsuiteProperties: TestSuiteProps): TestSuite =>
    TestSuite.create(testsuiteProperties);
}
