import {
  QualTestSuiteProps,
  parseQualTestType,
  QualTestSuite,
} from '../../domain/entities/qual-test-suite';
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
  IQualTestSuiteRepo,
  QualTestSuiteQueryDto,
  QualTestSuiteUpdateDto,
} from '../../domain/qual-test-suite/i-qual-test-suite-repo';
import { parseMaterializationType } from '../../domain/value-types/materialization-type';

export default class QualTestSuiteRepo
  extends BaseSfRepo<
    QualTestSuite,
    QualTestSuiteProps,
    QualTestSuiteQueryDto,
    QualTestSuiteUpdateDto
  >
  implements IQualTestSuiteRepo
{
  readonly matName = 'test_suites_qual';

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
    { name: 'last_alert_sent', nullable: true},
  ];

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(querySnowflake: QuerySnowflake) {
    super(querySnowflake);
  }

  buildEntityProps = (sfEntity: SnowflakeEntity): QualTestSuiteProps => {
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
      LAST_ALERT_SENT: lastAlertSent,
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
      !QualTestSuiteRepo.isOptionalOfType<string>(columnName, 'string') ||
      typeof targetResourceId !== 'string' ||
      typeof cron !== 'string' ||
      typeof executionType !== 'string' ||
      !isOptionalDateField(deletedAt) ||
      !isOptionalDateField(lastAlertSent)
    )
      throw new Error(
        'Retrieved unexpected qual test suite field types from persistence'
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
      type: parseQualTestType(type),
      cron,
      executionType: parseExecutionType(executionType),
      deletedAt: deletedAt ? deletedAt.toISOString() : undefined,
      lastAlertSent: lastAlertSent ? lastAlertSent.toISOString() : undefined,
    };
  };

  getBinds = (entity: QualTestSuite): (string | number)[] => [
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
    entity.lastAlertSent || 'null',
  ];

  buildFindByQuery = (queryDto: QualTestSuiteQueryDto): Query => {
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

    const text = `select * from ${relationPath}.${this.matName}
    where ${whereClause};`;

    return { text, binds };
  };

  buildUpdateQuery = (id: string, updateDto: QualTestSuiteUpdateDto): Query => {
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
    if (updateDto.lastAlertSent) {
      colDefinitions.push(this.getDefinition('last_alert_sent'));
      binds.push(updateDto.lastAlertSent);
    }

    const text = getUpdateQueryText(this.matName, colDefinitions, [
      `(${binds.map(() => '?').join(', ')})`,
    ]);

    return { text, binds, colDefinitions };
  };

  toEntity = (qualtestsuiteProperties: QualTestSuiteProps): QualTestSuite =>
    QualTestSuite.create(qualtestsuiteProperties);
}
