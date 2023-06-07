import { Document } from "mongodb";
import { IDbConnection } from "./i-db";

export interface IServiceRepo<Entity, QueryDto, UpdateDto> {
  findOne(id: string, dbConnection: IDbConnection, callerOrgId: string): Promise<Entity | null>;
  findBy(queryDto: QueryDto, dbConnection: IDbConnection, callerOrgId: string, returnEntity: boolean): Promise<Entity[] | Document[]>;
  all(dbConnection: IDbConnection, callerOrgId: string): Promise<Entity[]>;
  insertOne(entity: Entity, dbConnection: IDbConnection, callerOrgId: string): Promise<string>;
  insertMany(entities: Entity[], dbConnection: IDbConnection, callerOrgId: string): Promise<string[]>;
  updateOne(
    id: string,
    updateDto: UpdateDto,
    dbConnection: IDbConnection, callerOrgId: string
  ): Promise<string>;
  replaceMany(entities: Entity[], dbConnection: IDbConnection, callerOrgId: string): Promise<number>;
  softDeleteOne(id: string, dbConnection: IDbConnection, callerOrgId: string): Promise<void>;
  softDeleteMany(
    where: { targetResourceIds: string[]; testSuiteIds: string[] },
    dbConnection: IDbConnection, callerOrgId: string
  ): Promise<void>;
}
