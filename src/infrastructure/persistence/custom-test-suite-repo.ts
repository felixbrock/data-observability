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
import {
  Binds,
  SnowflakeEntity,
} from '../../domain/snowflake-api/i-snowflake-api-repo';
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
    { name: 'importance_threshold', nullable: false },
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

  buildEntityProps = (sfEntity: SnowflakeEntity): CustomTestSuiteProps => {
    const {
      ID: id,
      ACTIVATED: activated,
      NAME: name,
      DESCRIPTION: description,
      SQL_LOGIC: sqlLogic,
      TARGET_RESOURCE_IDS: targetResourceIds,
      CRON: cron,
      EXECUTION_TYPE: executionType,
      IMPORTANCE_THRESHOLD: importanceThreshold,
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
      typeof activated !== 'boolean' ||
      typeof name !== 'string' ||
      !CustomTestSuiteRepo.isOptionalOfType<string>(description, 'string') ||
      typeof sqlLogic !== 'string' ||
      !CustomTestSuiteRepo.isStringArray(targetResourceIds) ||
      typeof cron !== 'string' ||
      typeof executionType !== 'string' ||
      typeof importanceThreshold !== 'number' ||
      !isOptionalDateField(deletedAt) ||
      typeof customUpperThreshold !== 'number' ||
      typeof customLowerThreshold !== 'number'
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
      importanceThreshold,
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

  buildFindByQuery = (queryDto: CustomTestSuiteQueryDto): Query => {
    const binds: (string | number)[] = [];
    let whereClause = `deleted_at is ${queryDto.deleted ? 'not' : ''} null`;

    if (queryDto.activated !== undefined) {
      binds.push(queryDto.activated.toString());
      const whereCondition = 'activated = ?';
      whereClause += ` and ${whereCondition} `;
    }

    const text = `select * from ${relationPath}.${this.matName}
    where ${whereClause};`;

    return { text, binds };
  };

  getBinds = (entity: CustomTestSuite): (string | number)[] => [
    entity.id,
    entity.activated.toString(),
    entity.name,
    entity.description,
    entity.sqlLogic,
    JSON.stringify(entity.targetResourceIds),
    entity.cron || 'null',
    entity.executionType,
    entity.importanceThreshold,
    entity.deletedAt || 'null',
    entity.customLowerThreshold || 'null',
    entity.customLowerThresholdMode,
    entity.customUpperThreshold || 'null',
    entity.customUpperThresholdMode,
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
    if (updateDto.importanceThreshold) {
      colDefinitions.push(this.getDefinition('importance_threshold'));
      binds.push(updateDto.importanceThreshold);
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

  toEntity = (
    customtestsuiteProperties: CustomTestSuiteProps
  ): CustomTestSuite => CustomTestSuite.create(customtestsuiteProperties);
}
