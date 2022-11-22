import { IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';

export type IAuth = {
  jwt?: string;
  isSystemInternal?: boolean;
  callerOrgId?: string;
};

export interface IServiceRepo<Entity, QueryDto, UpdateDto> {
  findOne(
    id: string,
    auth: IAuth,
    connPool: IConnectionPool,
  ): Promise<Entity | null>;
  findBy(
    queryDto: QueryDto,
    auth: IAuth,
    connPool: IConnectionPool,
  ): Promise<Entity[]>;
  all(
    auth: IAuth,
    connPool: IConnectionPool,
  ): Promise<Entity[]>;
  insertOne(
    entity: Entity,
    auth: IAuth,
    connPool: IConnectionPool,
  ): Promise<string>;
  insertMany(
    entities: Entity[],
    auth: IAuth,
    connPool: IConnectionPool,
  ): Promise<string[]>;
  updateOne(
    id: string,
    updateDto: UpdateDto,
    auth: IAuth,
    connPool: IConnectionPool,
  ): Promise<string>;
  replaceMany(
    entities: Entity[],
    auth: IAuth,
    connPool: IConnectionPool,
  ): Promise<number>;
}
