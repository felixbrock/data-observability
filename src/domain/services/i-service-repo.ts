import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export interface IServiceRepo<Entity, QueryDto, UpdateDto> {
  findOne(id: string, connPool: IConnectionPool): Promise<Entity | null>;
  findBy(queryDto: QueryDto, connPool: IConnectionPool): Promise<Entity[]>;
  all(connPool: IConnectionPool): Promise<Entity[]>;
  insertOne(entity: Entity, connPool: IConnectionPool): Promise<string>;
  insertMany(entities: Entity[], connPool: IConnectionPool): Promise<string[]>;
  updateOne(
    id: string,
    updateDto: UpdateDto,
    connPool: IConnectionPool
  ): Promise<string>;
  replaceMany(entities: Entity[], connPool: IConnectionPool): Promise<number>;
}
