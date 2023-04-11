import { TestSuite } from '../entities/quant-test-suite';
import { IServiceRepo } from '../services/i-service-repo';
import { CustomThresholdMode } from '../value-types/custom-threshold-mode';
import { ExecutionType } from '../value-types/execution-type';

export interface TestSuiteUpdateDto {
  activated?: boolean;
  customLowerThreshold?: { value: number; mode: CustomThresholdMode };
  customUpperThreshold?: { value: number; mode: CustomThresholdMode };
  cron?: string;
  executionType?: ExecutionType;
  feedbackLowerThreshold?: number;
  feedbackUpperThreshold?: number;
  lastAlertSent?: string;
}

export interface TestSuiteQueryDto {
  activated?: boolean;
  ids?: string[];
  targetResourceIds?: string[];
  deleted: boolean;
}

export type ITestSuiteRepo = IServiceRepo<
  TestSuite,
  TestSuiteQueryDto,
  TestSuiteUpdateDto
>;
