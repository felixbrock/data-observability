import { CustomTestSuite } from '../entities/custom-test-suite';
import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';
import BaseAuth from '../services/base-auth';
import { ExecutionType } from '../value-types/execution-type';

export interface CustomTestSuiteUpdateDto {
  activated?: boolean;
  threshold?: number;
  frequency?: number;
  targetResourceIds?: string[];
  name?: string;
  description?: string;
  sqlLogic?: string;
  cron?: string;
  executionType?: ExecutionType;
}

export interface CustomTestSuiteQueryDto {
  activated?: boolean;
  executionFrequency?: number;
}

export type Auth = BaseAuth;

export interface ICustomTestSuiteRepo {
  findOne(
    id: string,
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<CustomTestSuite | null>;
  findBy(
    queryDto: CustomTestSuiteQueryDto,
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<CustomTestSuite[]>;
  all(
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<CustomTestSuite[]>;
  insertOne(
    entity: CustomTestSuite,
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<string>;
  updateOne(
    id: string,
    updateDto: CustomTestSuiteUpdateDto,
    profile: SnowflakeProfileDto,
    auth: Auth,
    targetOrgId?: string
  ): Promise<string>;
}
