import { IBaseServiceRepo } from '../../../domain/services/i-base-service-repo';
import { SnowflakeProfileDto } from '../../../domain/integration-api/i-integration-api-repo';
import BaseAuth from '../../../domain/services/base-auth';
import { SnowflakeEntity } from '../../../domain/snowflake-api/i-snowflake-api-repo';
import { QuerySnowflake } from '../../../domain/snowflake-api/query-snowflake';
import {
  ColumnDefinition,
  getInsertQueryText,
  getUpdateQueryText,
  relationPath,
} from './query';

export interface Query {
  text: string;
  binds: (string | number)[];
  colDefinitions?: ColumnDefinition[];
}

export default abstract class BaseSfRepo<
  Entity extends { id: string },
  EntityProps,
  QueryDto extends object,
  UpdateDto extends object
> implements IBaseServiceRepo<Entity, QueryDto, UpdateDto>
{
  protected abstract readonly matName: string;

  protected abstract readonly colDefinitions: ColumnDefinition[];

  protected readonly querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.querySnowflake = querySnowflake;
  }

  findOne = async (
    id: string,
    profile: SnowflakeProfileDto,
    auth: BaseAuth,
    targetOrgId?: string
  ): Promise<Entity | null> => {
    try {
      const queryText = `select * from ${relationPath}.${this.matName}
       where id = ?;`;

      const binds: (string | number)[] = [id];

      const result = await this.querySnowflake.execute(
        { queryText, targetOrgId, binds, profile },
        auth
      );

      if (!result.success) throw new Error(result.error);
      if (!result.value) throw new Error('Missing sf query value');
      if (result.value.length > 1)
        throw new Error(`Multiple customtestsuite entities with id found`);

      return !result.value.length
        ? null
        : this.toEntity(this.buildEntityProps(result.value[0]));
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  protected abstract buildFindByQuery(
    dto: QueryDto
  ): Query;

  findBy = async (
    queryDto: QueryDto,
    profile: SnowflakeProfileDto,
    auth: BaseAuth,
    targetOrgId?: string
  ): Promise<Entity[]> => {
    try {
      if (!Object.keys(queryDto).length)
        return await this.all(profile, auth, targetOrgId);

      const query = this.buildFindByQuery(queryDto);

      const result = await this.querySnowflake.execute(
        { queryText: query.text, targetOrgId, binds: query.binds, profile },
        auth
      );

      if (!result.success) throw new Error(result.error);
      if (!result.value) throw new Error('Missing sf query value');

      return result.value.map((el) => this.toEntity(this.buildEntityProps(el)));
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  all = async (
    profile: SnowflakeProfileDto,
    auth: BaseAuth,
    targetOrgId?: string
  ): Promise<Entity[]> => {
    try {
      const queryText = `select * from ${relationPath}.${this.matName};`;

      const result = await this.querySnowflake.execute(
        { queryText, targetOrgId, binds: [], profile },
        auth
      );

      if (!result.success) throw new Error(result.error);
      if (!result.value) throw new Error('Missing sf query value');

      return result.value.map((el) => this.toEntity(this.buildEntityProps(el)));
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  protected abstract getBinds(entity: Entity): (string | number)[];

  insertOne = async (
    entity: Entity,
    profile: SnowflakeProfileDto,
    auth: BaseAuth,
    targetOrgId?: string
  ): Promise<string> => {
    try {
      const binds = this.getBinds(entity);

      const row = `(${binds.map(() => '?').join(', ')})`;

      const queryText = getInsertQueryText(this.matName, this.colDefinitions, [
        row,
      ]);

      const result = await this.querySnowflake.execute(
        { queryText, targetOrgId, binds, profile },
        auth
      );

      if (!result.success) throw new Error(result.error);
      if (!result.value) throw new Error('Missing sf query value');

      return entity.id;
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  insertMany = async (
    entities: Entity[],
    profile: SnowflakeProfileDto,
    auth: BaseAuth,
    targetOrgId?: string
  ): Promise<string[]> => {
    try {
      const binds = entities.map((entity) =>
        this.getBinds(entity)
      );

      const row = `(${this.colDefinitions.map(() => '?').join(', ')})`;

      const queryText = getInsertQueryText(this.matName, this.colDefinitions, [
        row,
      ]);

      const result = await this.querySnowflake.execute(
        { queryText, targetOrgId, binds, profile },
        auth
      );

      if (!result.success) throw new Error(result.error);
      if (!result.value) throw new Error('Missing sf query value');

      return entities.map((el) => el.id);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  getDefinition = (name: string): ColumnDefinition => {
    const def = this.colDefinitions.find((el) => el.name === name);
    if (!def) throw new Error('Missing col definition');

    return def;
  };

  protected abstract buildUpdateQuery(
    id:string,
    dto: UpdateDto
  ): Query;

  updateOne = async (
    id: string,
    updateDto: UpdateDto,
    profile: SnowflakeProfileDto,
    auth: BaseAuth,
    targetOrgId?: string
  ): Promise<string> => {
    try {
      const query = this.buildUpdateQuery(id, updateDto);

      if (!query.colDefinitions)
        throw new Error(
          'No column definitions found. Cannot perform update operation'
        );

      const queryText = getUpdateQueryText(this.matName, query.colDefinitions, [
        `(${query.binds.map(() => '?').join(', ')})`,
      ]);

      const result = await this.querySnowflake.execute(
        { queryText, targetOrgId, binds: query.binds, profile },
        auth
      );

      if (!result.success) throw new Error(result.error);
      if (!result.value) throw new Error('Missing sf query value');

      return id;
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

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
}
