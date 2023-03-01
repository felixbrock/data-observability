import { CustomTestSuite } from '../entities/custom-test-suite';
import { IServiceRepo } from '../services/i-service-repo';
import { ExecutionType } from '../value-types/execution-type';

export interface CustomTestSuiteUpdateDto {
  activated?: boolean;
  threshold?: number;
  targetResourceIds?: string[];
  name?: string;
  description?: string;
  sqlLogic?: string;
  cron?: string;
  executionType?: ExecutionType;
  importanceThreshold?: number;
  boundsIntervalRelative?: number;
}

export interface CustomTestSuiteQueryDto {
  activated?: boolean;
  targetResourceIds?: string[];
  deleted: boolean;
}

export type ICustomTestSuiteRepo = IServiceRepo<
  CustomTestSuite,
  CustomTestSuiteQueryDto,
  CustomTestSuiteUpdateDto
>;
