import { Document } from 'mongodb';
import {
  parseTestType,
  TestSuite,
  TestSuiteProps,
} from '../../domain/entities/quant-test-suite';
import {
  ColumnDefinition,
} from './shared/query';
import { QuerySnowflake } from '../../domain/snowflake-api/query-snowflake';
import {
  Bind,
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
    { name: 'feedback_lower_threshold', nullable: true },
    { name: 'feedback_upper_threshold', nullable: true },
    { name: 'last_alert_sent', nullable: true },
  ];

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(querySnowflake: QuerySnowflake) {
    super(querySnowflake);
  }

  buildEntityProps = (document: Document): TestSuiteProps => {
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
      custom_lower_threshold: customLowerThreshold,
      custom_lower_threshold_mode: customLowerThresholdMode,
      custom_upper_threshold: customUpperThreshold,
      custom_upper_threshold_mode: customUpperThresholdMode,
      feedback_lower_threshold: feedbackLowerThreshold,
      feedback_upper_threshold: feedbackUpperThreshold,
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
      !TestSuiteRepo.isOptionalOfType<string>(columnName, 'string') ||
      typeof targetResourceId !== 'string' ||
      typeof cron !== 'string' ||
      typeof executionType !== 'string' ||
      !isOptionalDateField(deletedAtDate) ||
      !TestSuiteRepo.isOptionalOfType<number>(customUpperThreshold, 'number') ||
      !TestSuiteRepo.isOptionalOfType<number>(customLowerThreshold, 'number') ||
      !TestSuiteRepo.isOptionalOfType<number>(
        feedbackUpperThreshold,
        'number'
      ) ||
      !TestSuiteRepo.isOptionalOfType<number>(feedbackLowerThreshold, 'number') ||
      !isOptionalDateField(lastAlertSentDate)
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
      deletedAt: deletedAtDate? deletedAtDate.toISOString(): undefined,
      customLowerThreshold,
      customLowerThresholdMode: parseCustomThresholdMode(
        customLowerThresholdMode
      ),
      customUpperThreshold,
      customUpperThresholdMode: parseCustomThresholdMode(
        customUpperThresholdMode
      ),
      feedbackLowerThreshold,
      feedbackUpperThreshold,
      lastAlertSent: lastAlertSentDate? lastAlertSentDate.toISOString() : undefined,
    };
  };

  getBinds = (entity: TestSuite): (string | number | boolean)[] => [
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
    entity.customLowerThreshold || 'null',
    entity.customLowerThresholdMode,
    entity.customUpperThreshold || 'null',
    entity.customUpperThresholdMode,
    entity.feedbackLowerThreshold || 'null',
    entity.feedbackUpperThreshold || 'null',
    entity.lastAlertSent || 'null',
  ];

  buildFindByQuery = (queryDto: TestSuiteQueryDto): Query => {
    const filter: any = {};
    const binds: (string | number | boolean)[] = [];
    filter.deleted_at = queryDto.deleted ? { $ne: null } : null;

    if (queryDto.activated !== undefined) {
      filter.activated = queryDto.activated;
      binds.push(queryDto.activated);
    }

    if (queryDto.ids && queryDto.ids.length) {
      filter.id = { $in: queryDto.ids };
      binds.push(...queryDto.ids);
    }

    if (queryDto.targetResourceIds && queryDto.targetResourceIds.length) {
      filter.target_resource_id = { $in: queryDto.targetResourceIds };
      binds.push(...queryDto.targetResourceIds);
    }

    return { binds, filter };
  };

  buildUpdateQuery = (id: string, updateDto: TestSuiteUpdateDto): Query => {
    const colDefinitions: ColumnDefinition[] = [this.getDefinition('id')];
    const binds: (Bind | boolean)[] = [id];

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
    if (updateDto.feedbackLowerThreshold) {
      	colDefinitions.push(this.getDefinition('feedback_lower_threshold'));
      	binds.push(updateDto.feedbackLowerThreshold);
    }
    if (updateDto.feedbackUpperThreshold) {
      	colDefinitions.push(this.getDefinition('feedback_upper_threshold'));
      	binds.push(updateDto.feedbackUpperThreshold);
    }
		if (updateDto.lastAlertSent) {
			colDefinitions.push(this.getDefinition('last_alert_sent'));
			binds.push(updateDto.lastAlertSent);
		}

		return { binds, colDefinitions };
  };

  toEntity = (testsuiteProperties: TestSuiteProps): TestSuite =>
    TestSuite.create(testsuiteProperties);
}
