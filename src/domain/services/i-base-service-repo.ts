import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';
import BaseAuth from './base-auth';

export type Auth = BaseAuth;

export interface IBaseServiceRepo<Entity, QueryDto, UpdateDto> {
  findOne(
    id: string,
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<Entity | null>;
  findBy(
    queryDto: QueryDto,
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<Entity[]>;
  all(
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<Entity[]>;
  insertOne(
    entity: Entity,
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<string>;
  insertMany(   
    entities: Entity[],
    profile: SnowflakeProfileDto,
    auth: BaseAuth,
    targetOrgId?: string
  ): Promise<string[]>;
  updateOne(
    id: string,
    updateDto: UpdateDto,
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<string>;
}
