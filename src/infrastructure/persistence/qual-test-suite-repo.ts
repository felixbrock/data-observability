import { Document } from 'mongodb';
import {
  QualTestSuiteProps,
  parseQualTestType,
  QualTestSuite,
} from '../../domain/entities/qual-test-suite';
import {
  ColumnDefinition,
} from './shared/query';
import { QuerySnowflake } from '../../domain/snowflake-api/query-snowflake';
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

  buildEntityProps = (document: Document): QualTestSuiteProps => {
    const {
      id,
      test_type: type,
      activated,
      database_name: databaseName,
      schema_name: schemaName,
      materialization_name: materializationName,
      materialization_type: materializationType,
      column_name: columnName,
      target_resource_id: targetResourceId,
      cron,
      execution_type: executionType,
      deleted_at: deletedAt,
      last_alert_sent: lastAlertSent,
    } = document;

    const deletedAtDate = deletedAt ? new Date(deletedAt) : undefined;

    const lastAlertSentDate = lastAlertSent ? new Date(lastAlertSent) : undefined;

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
      !isOptionalDateField(deletedAtDate) ||
      !isOptionalDateField(lastAlertSentDate)
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
      deletedAt: deletedAtDate ? deletedAtDate.toISOString() : undefined,
      lastAlertSent: lastAlertSentDate ? lastAlertSentDate.toISOString() : undefined,
    };
  };

  getValues = (entity: QualTestSuite): (string | number | boolean)[] => [
    entity.id,
    entity.type,
    entity.activated,
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
    const values: (string | number | boolean)[] = [];
    const filter: any = {};
    filter.deleted_at = queryDto.deleted ? { $ne: null } : null;

    if (queryDto.activated !== undefined) {
      values.push(queryDto.activated);
      filter.activated = queryDto.activated;
    }
    if (queryDto.ids && queryDto.ids.length) {
      values.push(...queryDto.ids);
      filter.id = { $in: queryDto.ids };
    }
    if (queryDto.targetResourceIds && queryDto.targetResourceIds.length) {
      values.push(...queryDto.targetResourceIds);
      filter.target_resource_id = { $in: queryDto.targetResourceIds };
    }

    return { values, filter };
  };

  buildUpdateQuery = (id: string, updateDto: QualTestSuiteUpdateDto): Query => {
    const colDefinitions: ColumnDefinition[] = [this.getDefinition('id')];
    const values: (string | number | boolean)[] = [id];

		if (updateDto.activated !== undefined) {
			colDefinitions.push(this.getDefinition('activated'));
			values.push(updateDto.activated.toString());
		}
		if (updateDto.cron) {
			colDefinitions.push(this.getDefinition('cron'));
			values.push(updateDto.cron);
		}
		if (updateDto.executionType) {
			colDefinitions.push(this.getDefinition('execution_type'));
			values.push(updateDto.executionType);
		}
		if (updateDto.lastAlertSent) {
			colDefinitions.push(this.getDefinition('last_alert_sent'));
			values.push(updateDto.lastAlertSent);
		}

		return { values, colDefinitions };
  };

  toEntity = (qualtestsuiteProperties: QualTestSuiteProps): QualTestSuite =>
    QualTestSuite.create(qualtestsuiteProperties);
}
