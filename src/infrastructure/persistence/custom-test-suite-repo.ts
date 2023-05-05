import { Document } from 'mongodb';
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
} from './shared/query';
import { QuerySnowflake } from '../../domain/snowflake-api/query-snowflake';
import BaseSfRepo, { Query } from './shared/base-sf-repo';
import { parseExecutionType } from '../../domain/value-types/execution-type';
import { parseCustomThresholdMode } from '../../domain/value-types/custom-threshold-mode';

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
    { name: 'id', nullable: false },
    { name: 'activated', nullable: false },
    { name: 'name', nullable: false },
    { name: 'description', nullable: true },
    { name: 'sql_logic', nullable: false },
    { name: 'target_resource_ids', selectType: 'parse_json', nullable: false },
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
    { name: 'last_alert_sent', nullable: true},
  ];

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(querySnowflake: QuerySnowflake) {
    super(querySnowflake);
  }

  buildEntityProps = (document: Document): CustomTestSuiteProps => {
    const {
      id,
      activated,
      name,
      description,
      sql_logic: sqlLogic,
      target_resource_ids: targetResourceIds,
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
      typeof activated !== 'boolean' ||
      typeof name !== 'string' ||
      !CustomTestSuiteRepo.isOptionalOfType<string>(description, 'string') ||
      typeof sqlLogic !== 'string' ||
      !CustomTestSuiteRepo.isStringArray(targetResourceIds) ||
      typeof cron !== 'string' ||
      typeof executionType !== 'string' ||
      !isOptionalDateField(deletedAtDate) ||
      !CustomTestSuiteRepo.isOptionalOfType<number>(customUpperThreshold, 'number') ||
      !CustomTestSuiteRepo.isOptionalOfType<number>(customLowerThreshold, 'number') ||
      typeof customUpperThresholdMode !== 'string' ||
      typeof customLowerThresholdMode !== 'string' ||
      !CustomTestSuiteRepo.isOptionalOfType<number>(feedbackUpperThreshold, 'number') ||
      !CustomTestSuiteRepo.isOptionalOfType<number>(feedbackLowerThreshold, 'number') ||
      !isOptionalDateField(lastAlertSentDate)
    )
      throw new Error(
        'Retrieved unexpected custom test suite field types from persistence'
      );

    return {
      id,
      activated,
      name,
      description,
      sqlLogic,
      targetResourceIds,
      cron,
      executionType: parseExecutionType(executionType),
      deletedAt: deletedAtDate ? deletedAtDate.toISOString() : undefined,
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
      lastAlertSent: lastAlertSentDate ? lastAlertSentDate.toISOString() : undefined, 
    };
  };

  buildFindByQuery = (queryDto: CustomTestSuiteQueryDto): Query => {
    const values: (string | number | boolean)[] = [];
    const filter: any = {};
    filter.deleted_at = queryDto.deleted ? { $ne: null } : null;

    if (queryDto.activated !== undefined) {
      values.push(queryDto.activated);
      filter.activated = queryDto.activated;
    }

    return { values, filter };
  };

  getValues = (entity: CustomTestSuite): (string | number | boolean)[] => [
    entity.id,
    entity.activated,
    entity.name,
    entity.description,
    entity.sqlLogic,
    JSON.stringify(entity.targetResourceIds),
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

  buildUpdateQuery = (
    id: string,
    updateDto: CustomTestSuiteUpdateDto
  ): Query => {
    const colDefinitions: ColumnDefinition[] = [this.getDefinition('id')];
    const values: (string | number | boolean)[] = [id];

    if (updateDto.activated !== undefined) {
      colDefinitions.push(this.getDefinition('activated'));
      values.push(updateDto.activated);
    }
    if (updateDto.name) {
      colDefinitions.push(this.getDefinition('name'));
      values.push(updateDto.name);
    }
    if (updateDto.description) {
      colDefinitions.push(this.getDefinition('description'));
      values.push(updateDto.description);
    }
    if (updateDto.sqlLogic) {
      colDefinitions.push(this.getDefinition('sql_logic'));
      values.push(updateDto.sqlLogic);
    }
    if (updateDto.targetResourceIds) {
      colDefinitions.push(this.getDefinition('target_resource_ids'));
      values.push(JSON.stringify(updateDto.targetResourceIds));
    }
    if (updateDto.cron) {
      colDefinitions.push(this.getDefinition('cron'));
      values.push(updateDto.cron);
    }
    if (updateDto.executionType) {
      colDefinitions.push(this.getDefinition('execution_type'));
      values.push(updateDto.executionType);
    }
    if (updateDto.customLowerThreshold) {
      colDefinitions.push(this.getDefinition('custom_lower_threshold'));
      values.push(updateDto.customLowerThreshold.value);
      colDefinitions.push(this.getDefinition('custom_lower_threshold_mode'));
      values.push(updateDto.customLowerThreshold.mode);
    }
    if (updateDto.customUpperThreshold) {
      colDefinitions.push(this.getDefinition('custom_upper_threshold'));
      values.push(updateDto.customUpperThreshold.value);
      colDefinitions.push(this.getDefinition('custom_upper_threshold_mode'));
      values.push(updateDto.customUpperThreshold.mode);
    }
    if (updateDto.feedbackLowerThreshold) {
      colDefinitions.push(this.getDefinition('feedback_lower_threshold'));
      values.push(updateDto.feedbackLowerThreshold);
    }
    if (updateDto.feedbackUpperThreshold) {
      colDefinitions.push(this.getDefinition('feedback_upper_threshold'));
      values.push(updateDto.feedbackUpperThreshold);
    }
    if (updateDto.lastAlertSent) {
      colDefinitions.push(this.getDefinition('last_alert_sent'));
      values.push(updateDto.lastAlertSent);
    }

    return { values, colDefinitions };
  };

  toEntity = (
    customtestsuiteProperties: CustomTestSuiteProps
  ): CustomTestSuite => CustomTestSuite.create(customtestsuiteProperties);
}
