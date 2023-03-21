import { CustomTestSuite } from '../entities/custom-test-suite';
import { IServiceRepo } from '../services/i-service-repo';
import { CustomThresholdMode } from '../value-types/custom-threshold-mode';
import { ExecutionType } from '../value-types/execution-type';

export interface CustomTestSuiteUpdateDto {
  activated?: boolean;
  customLowerThreshold?: { value: number; mode: CustomThresholdMode };
  customUpperThreshold?: { value: number; mode: CustomThresholdMode };
  targetResourceIds?: string[];
  name?: string;
  description?: string;
  sqlLogic?: string;
  cron?: string;
  executionType?: ExecutionType;
  importanceThreshold?: number;
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
