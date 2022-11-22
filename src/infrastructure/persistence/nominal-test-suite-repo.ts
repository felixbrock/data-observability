import { NominalTestSuite, NominalTestSuiteProps, parseNominalTestType } from '../../domain/entities/nominal-test-suite';
import {
  ColumnDefinition,
  getUpdateQueryText,
  relationPath,
} from './shared/query';
import { QuerySnowflake } from '../../domain/snowflake-api/query-snowflake';
import { Binds, SnowflakeEntity } from '../../domain/snowflake-api/i-snowflake-api-repo';
import BaseSfRepo, { Query } from './shared/base-sf-repo';
import { parseExecutionType } from '../../domain/value-types/execution-type';
import {
  INominalTestSuiteRepo,
  NominalTestSuiteQueryDto,
  NominalTestSuiteUpdateDto,
} from '../../domain/nominal-test-suite/i-nominal-test-suite-repo';
import { parseMaterializationType } from '../../domain/value-types/materialization-type';

export default class NominalTestSuiteRepo
  extends BaseSfRepo<
    NominalTestSuite,
    NominalTestSuiteProps,
    NominalTestSuiteQueryDto,
    NominalTestSuiteUpdateDto
  >
  implements INominalTestSuiteRepo
{
  readonly matName = 'test_suites_nominal';

  readonly colDefinitions: ColumnDefinition[] = [
    { name: 'id', nullable: true },
    { name: 'test_type', nullable: true },
    { name: 'activated', nullable: true },
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

  buildEntityProps = (sfEntity: SnowflakeEntity): NominalTestSuiteProps => {
    const {
      ID: id,
      TEST_TYPE: type,
      ACTIVATED: activated,
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
      !NominalTestSuiteRepo.isOptionalOfType<string>(id, 'string') ||
      !NominalTestSuiteRepo.isOptionalOfType<string>(type, 'string') ||
      !NominalTestSuiteRepo.isOptionalOfType<boolean>(activated, 'boolean') ||
      !NominalTestSuiteRepo.isOptionalOfType<number>(executionFrequency, 'string') ||
      !NominalTestSuiteRepo.isOptionalOfType<string>(databaseName, 'string') ||
      !NominalTestSuiteRepo.isOptionalOfType<string>(schemaName, 'string') ||
      !NominalTestSuiteRepo.isOptionalOfType<string>(materializationName, 'string') ||
      !NominalTestSuiteRepo.isOptionalOfType<string>(materializationType, 'string') ||
      !NominalTestSuiteRepo.isOptionalOfType<string>(columnName, 'string') ||
      !NominalTestSuiteRepo.isOptionalOfType<string>(targetResourceId, 'string') ||
      !NominalTestSuiteRepo.isOptionalOfType<string>(organizationId, 'string') ||
      !NominalTestSuiteRepo.isOptionalOfType<string>(cron, 'string') ||
      !NominalTestSuiteRepo.isOptionalOfType<string>(executionType, 'string')
    )
      throw new Error(
        'Retrieved unexpected nominal test suite field types from persistence'
      );

    return {
      id,
      activated,
      executionFrequency,
      target: {
        databaseName,
        materializationName,
        materializationType: parseMaterializationType(materializationType),
        schemaName,
        targetResourceId,
        columnName,
      },
      type: parseNominalTestType(type),
      organizationId,
      cron,
      executionType: parseExecutionType(executionType),
    };
  };

  getBinds = (entity: NominalTestSuite): (string | number)[] => [
    entity.id,
    entity.type,
    entity.activated.toString(),
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

  buildFindByQuery = (queryDto: NominalTestSuiteQueryDto): Query => {
    const binds: (string | number)[] = [];
    let whereClause = '';

    if (queryDto.activated !== undefined) {
      binds.push(queryDto.activated.toString());
      const whereCondition = 'activated = ?';
      whereClause = whereCondition;
    }
    if(queryDto.ids && queryDto.ids.length) {
      binds.push(queryDto.ids.map((el) => `'${el}'`).join(', '));
      const whereCondition = 'array_contains(id::variant, array_construct(?))';
      whereClause = whereClause
        ? whereClause.concat(`and ${whereCondition} `)
        : whereCondition;
    }

    const text = `select * from ${relationPath}.${this.matName}
        ${whereClause ? 'where': ''}  ${whereClause};`;

    return { text, binds };
  };

  buildUpdateQuery = (id: string, updateDto: NominalTestSuiteUpdateDto): Query => {
    const colDefinitions: ColumnDefinition[] = [this.getDefinition('id')];
    const binds : Binds = [id];

    if (updateDto.activated !== undefined) {
      colDefinitions.push(this.getDefinition('activated'));
      binds.push(updateDto.activated.toString());
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

  toEntity = (nominaltestsuiteProperties: NominalTestSuiteProps): NominalTestSuite =>
    NominalTestSuite.create(nominaltestsuiteProperties);
}
