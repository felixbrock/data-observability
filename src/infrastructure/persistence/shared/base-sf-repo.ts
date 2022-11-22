import { Blob } from 'node:buffer';
import BaseAuth from '../../../domain/services/base-auth';
import { IServiceRepo } from '../../../domain/services/i-service-repo';
import {
  Bind,
  Binds,
  IConnectionPool,
  SnowflakeEntity,
} from '../../../domain/snowflake-api/i-snowflake-api-repo';
import { QuerySnowflake } from '../../../domain/snowflake-api/query-snowflake';
import {
  ColumnDefinition,
  getInsertQueryText,
  getUpdateQueryText,
  relationPath,
} from './query';

export interface Query {
  text: string;
  binds: Bind[];
  colDefinitions?: ColumnDefinition[];
}

export default abstract class BaseSfRepo<
  Entity extends { id: string },
  EntityProps,
  QueryDto extends object | undefined,
  UpdateDto extends object | undefined
> implements IServiceRepo<Entity, QueryDto, UpdateDto>
{
  protected abstract readonly matName: string;

  protected abstract readonly colDefinitions: ColumnDefinition[];

  protected readonly querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.querySnowflake = querySnowflake;
  }

  findOne = async (
    id: string,
    auth: BaseAuth,
    connPool: IConnectionPool,
  ): Promise<Entity | null> => {
    try {
      const queryText = `select * from ${relationPath}.${this.matName}
       where id = ?;`;

      const binds: (string | number)[] = [id];

      const result = await this.querySnowflake.execute(
        { queryText, binds },
        auth,
        connPool
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

  protected abstract buildFindByQuery(dto: QueryDto): Query;

  findBy = async (
    queryDto: QueryDto,
    auth: BaseAuth,
    connPool: IConnectionPool,
  ): Promise<Entity[]> => {
    try {
      if (!queryDto || !Object.keys(queryDto).length)
        return await this.all(auth, connPool);

      const query = this.buildFindByQuery(queryDto);

      const result = await this.querySnowflake.execute(
        { queryText: query.text, binds: query.binds },
        auth,
        connPool
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

  findByCustom = async (
    query: { text: string; binds: Binds },
    auth: BaseAuth,
    connPool: IConnectionPool,
  ): Promise<Entity[]> => {
    try {
      const result = await this.querySnowflake.execute(
        { queryText: query.text, binds: query.binds },
        auth,
        connPool
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
    auth: BaseAuth,
    connPool: IConnectionPool,
  ): Promise<Entity[]> => {
    try {
      const queryText = `select * from ${relationPath}.${this.matName};`;

      const result = await this.querySnowflake.execute(
        { queryText, binds: [] },
        auth,
        connPool
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
    auth: BaseAuth,
    connPool: IConnectionPool,
  ): Promise<string> => {
    try {
      const binds = this.getBinds(entity);

      const row = `(${binds.map(() => '?').join(', ')})`;

      const queryText = getInsertQueryText(this.matName, this.colDefinitions, [
        row,
      ]);

      const result = await this.querySnowflake.execute(
        { queryText, binds },
        auth,
        connPool
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

  #splitBinds = (queryTextSize: number, binds: Binds): Binds[] => {
    // todo - Upload as file and then copy into table
    const byteToMBDivisor = 1000000;
    const maxQueryMBSize = 1;
    const querySizeOffset = 0.1;
    const maxQueryTextMBSize = 0.2;

    const queryTextMBSize = queryTextSize / byteToMBDivisor;
    const bindsSize = new Blob([JSON.stringify(binds)]).size;
    const bindsMBSize = bindsSize / byteToMBDivisor;

    if (queryTextMBSize + bindsMBSize < maxQueryMBSize * (1 - querySizeOffset))
      return [binds];
    if (queryTextMBSize > maxQueryTextMBSize)
      throw new Error('Query text size too large. Implement file upload');

    // in MB (subtracting offset)
    const maxSize = 1 * (1 - querySizeOffset);
    const maxBindsSequenceMBSize = maxSize - queryTextMBSize;

    const numSequences = Math.ceil(bindsMBSize / maxBindsSequenceMBSize);
    const numElementsPerSequence = Math.ceil(binds.length / numSequences);

    const res: Binds[] = [];
    for (let i = 0; i < binds.length; i += numElementsPerSequence) {
      const chunk = binds.slice(i, i + numElementsPerSequence);
      res.push(chunk);
    }

    return res;
  };

  insertMany = async (
    entities: Entity[],
    auth: BaseAuth,
    connPool: IConnectionPool,
  ): Promise<string[]> => {
    try {
      const binds = entities.map((entity) => this.getBinds(entity));

      const row = `(${this.colDefinitions.map(() => '?').join(', ')})`;

      const queryText = getInsertQueryText(this.matName, this.colDefinitions, [
        row,
      ]);

      const bindSequences = this.#splitBinds(new Blob([queryText]).size, binds);

      const results = await Promise.all(
        bindSequences.map(async (el) => {
          const res = await this.querySnowflake.execute(
            { queryText, binds: el },
            auth,
            connPool
          );

          return res;
        })
      );

      if (results.some((el) => !el.success))
        throw new Error(results.filter((el) => !el.success)[0].error);
      if (results.some((el) => !el.value))
        throw new Error('Missing sf query value');

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

  protected abstract buildUpdateQuery(id: string, dto: UpdateDto): Query;

  updateOne = async (
    id: string,
    updateDto: UpdateDto,
    auth: BaseAuth,
    connPool: IConnectionPool,
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
        { queryText, binds: query.binds },
        auth,
        connPool
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

  replaceMany = async (
    entities: Entity[],
    auth: BaseAuth,
    connPool: IConnectionPool,
  ): Promise<number> => {
    try {
      const binds = entities.map((column) => this.getBinds(column));

      const row = `(${this.colDefinitions.map(() => '?').join(', ')})`;

      const queryText = getUpdateQueryText(this.matName, this.colDefinitions, [
        row,
      ]);

      const bindSequences = this.#splitBinds(new Blob([queryText]).size, binds);

      const results = await Promise.all(
        bindSequences.map(async (el) => {
          const res = await this.querySnowflake.execute(
            { queryText, binds: el },
            auth,
            connPool
          );

          return res;
        })
      );

      if (results.some((el) => !el.success))
        throw new Error(results.filter((el) => !el.success)[0].error);
      if (results.some((el) => !el.value))
        throw new Error('Missing sf query value');

      return entities.length;
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
