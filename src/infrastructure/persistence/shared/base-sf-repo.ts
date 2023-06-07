import { Blob } from 'node:buffer';
import { Document } from 'mongodb';
import { IServiceRepo } from '../../../domain/services/i-service-repo';
import {
  Binds
} from '../../../domain/snowflake-api/i-snowflake-api-repo';
import { QuerySnowflake } from '../../../domain/snowflake-api/query-snowflake';
import {
  ColumnDefinition,
} from './query';
import { IDbConnection } from '../../../domain/services/i-db';

export interface Query {
  text?: string;
  values: (string | number | boolean)[];
  colDefinitions?: ColumnDefinition[];
  filter?: any
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
    dbConnection: IDbConnection,
    callerOrgId: string
  ): Promise<Entity | null> => {
    try {
      const result = await dbConnection
      .collection(`${this.matName}_${callerOrgId}`)
      .findOne({ id });

      if (!result) return null;
      
      return this.toEntity(this.buildEntityProps(result));
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  protected abstract buildFindByQuery(dto: QueryDto): Query;

  findBy = async (
    queryDto: QueryDto,
    dbConnection: IDbConnection,
    callerOrgId: string,
    returnEntity: boolean
  ): Promise<Entity[] | Document[]> => {
    try {
      if (!queryDto || !Object.keys(queryDto).length)
        return await this.all(dbConnection, callerOrgId);

      const query = this.buildFindByQuery(queryDto);

      const result = await dbConnection
      .collection(`${this.matName}_${callerOrgId}`)
      .find(query.filter).toArray();

      if (!result) return [];

      return returnEntity ? result.map((el) => this.toEntity(this.buildEntityProps(el))) : result;
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  // findByCustom = async (
  //   query: { text: string; binds: Binds },
  //   connPool: IConnectionPool
  // ): Promise<Entity[]> => {
  //   try {
  //     const result = await this.querySnowflake.execute({
  //       req: { queryText: query.text, binds: query.binds },
  //       connPool,
  //     });

  //     if (!result.success) throw new Error(result.error);
  //     if (!result.value) throw new Error('Missing sf query value');

  //     return result.value.map((el) => this.toEntity(this.buildEntityProps(el)));
  //   } catch (error: unknown) {
  //     if (error instanceof Error) console.error(error.stack);
  //     else if (error) console.trace(error);
  //     return Promise.reject(new Error());
  //   }
  // };

  all = async (dbConnection: IDbConnection, callerOrgId: string): Promise<Entity[]> => {
    try {
      const result = await dbConnection
      .collection(`${this.matName}_${callerOrgId}`)
      .find({}).toArray();

      if (!result) return [];

      return result.map((el) => this.toEntity(this.buildEntityProps(el)));
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  protected abstract getValues(entity: Entity): (string | number | boolean)[];

  insertOne = async (
    entity: Entity,
    dbConnection: IDbConnection,
    callerOrgId: string
  ): Promise<string> => {
    try {
			const row = this.getValues(entity);

			const document: any = {};
			this.colDefinitions.forEach((column, index) => {
        const value = row[index];
				document[column.name] = column.nullable && value === 'null' ? null : value;
			});

			const result = await dbConnection
      .collection(`${this.matName}_${callerOrgId}`)
      .insertOne(document);

      if (!result.acknowledged) throw new Error('Insert not acknowledged');


      return entity.id;
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
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
    dbConnection: IDbConnection,
    callerOrgId: string
  ): Promise<string[]> => {
    try {
      const rows = entities.map((entity) => this.getValues(entity));

			const documents = rows.map(row => {
				const document: any = {};
				this.colDefinitions.forEach((column, index) => {
					const value = row[index];
					document[column.name] = column.nullable && value === 'null' ? null : value;
				});

				return document;
			});

			const results = await dbConnection
      .collection(`${this.matName}_${callerOrgId}`)
      .insertMany(documents);

      if (results.insertedCount !== documents.length) {
        throw new Error('Failed to insert all documents successfully');
      }

      return entities.map((el) => el.id);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  getDefinition = (name: string): ColumnDefinition => {
    const def = this.colDefinitions.find((el) => el.name === name);
    if (!def) throw new Error('Missing col definition');

    return def;
  };

  protected abstract buildUpdateQuery(id: string, dto: UpdateDto): Query;

  #joinFieldsAndValues = (fields: string[], values: unknown[]): any => {
    const result: any = {};

    fields.forEach((field, index) => {
        result[field] = values[index];
    });

    return result;
  };

  updateOne = async (
    id: string,
    updateDto: UpdateDto,
    dbConnection: IDbConnection,
    callerOrgId: string
  ): Promise<string> => {
    try {
			const query = this.buildUpdateQuery(id, updateDto);

			if (!query.colDefinitions)
        throw new Error('No column definitions found. Cannot perform update operation');
			
      const updateObj: any = {};
      query.colDefinitions.forEach((column, index) => {
        const value = query.values[index];
        updateObj[column.name] = value;
      });

			const result = await dbConnection
      .collection(`${this.matName}_${callerOrgId}`)
			.updateOne(
				{ id },
				{ $set: updateObj }
			);

      if (result.matchedCount !== 1) {
        throw new Error('Failed to insert document');
      }

      return id;
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  replaceMany = async (
    entities: Entity[],
    dbConnection: IDbConnection,
    callerOrgId: string
  ): Promise<number> => {
    try {
      const rows = entities.map((column) => this.getValues(column));

      const documents = rows.map((row) => {
				const document: any = {};
				this.colDefinitions.forEach((column, index) => {
					const value = row[index];
					document[column.name] = column.nullable && value === 'null' ? null : value; 
				});
				return document;
			});

      const fields = this.colDefinitions.map((el) => el.name).slice(1);

			await Promise.all(documents.map(async (doc) => {
				const [id, ...values] = Object.values(doc);
        const updatedFields = this.#joinFieldsAndValues(fields, values);
				const res = await dbConnection
        .collection(`${this.matName}_${callerOrgId}`)
				.updateOne(
					{ id },
					{ $set: updatedFields }
				);

        if (res.matchedCount !== 1) {
          throw new Error('Failed to replace all documents');
        }
        
				return res;
			}));

      return entities.length;
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error());
    }
  };

  softDeleteOne = async (
    id: string,
    dbConnection: IDbConnection,
    callerOrgId: string
  ): Promise<void> => {
    try {
      const query = { id };

      const result = await dbConnection
      .collection(`${this.matName}_${callerOrgId}`)
      .updateOne(query, { $set: { activated: false, deleted_at: new Date().toISOString() } });

      if (result.matchedCount === 0) {
        throw new Error('No documents were deleted');
      }
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
    }
  };

  softDeleteMany = async (
    where: { targetResourceIds: string[]; testSuiteIds: string[] },
    dbConnection: IDbConnection,
    callerOrgId: string
  ): Promise<void> => {
    try {
      if (!where.targetResourceIds.length && !where.testSuiteIds.length)
        throw new Error('Missing where condition parameters');
      
      const query: any = {};

      if (where.targetResourceIds.length) {
        query.target_resource_id = { $in: where.targetResourceIds };
      }
      if (where.testSuiteIds.length) {
        query.test_suite_id = { $in: where.testSuiteIds};
      }

      const result = await dbConnection
      .collection(`${this.matName}_${callerOrgId}`)
      .updateMany(query, { $set: { deleted_at: new Date().toISOString() } });

      if (result.matchedCount === 0) {
        throw new Error('No documents were deleted');
      }
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
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

  protected abstract buildEntityProps(document: Document): EntityProps;

  protected abstract toEntity(materializationProps: EntityProps): Entity;
}
