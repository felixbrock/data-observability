import { SnowflakeEntity } from '../../../domain/snowflake-api/i-snowflake-api-repo';
import { QuerySnowflake } from '../../../domain/snowflake-api/query-snowflake';
import { ColumnDefinition } from './query';

export default abstract class BaseSfRepo<Entity, EntityProps> {
  protected abstract readonly matName: string;

  protected abstract readonly colDefinitions: ColumnDefinition[];

  protected readonly querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.querySnowflake = querySnowflake;
  }

  protected static isOptionalOfType = <T>(
    val: unknown,
    targetType:
      | 'string'
      | 'number'
      | 'bigint'
      | 'boolean'
      | 'symbol'
      | 'undefined'
      | 'object'
      | 'function'
  ): val is T => val === null || typeof val === targetType;

  protected static isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((el) => typeof el === 'string');

  protected abstract buildEntityProps(sfEntity: SnowflakeEntity): EntityProps;

  protected abstract toEntity(materializationProps: EntityProps): Entity;

  protected abstract getBinds(entity: Entity): (string | number)[];
}
