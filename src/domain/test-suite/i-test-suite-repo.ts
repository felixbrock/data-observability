import { TestSuite } from '../entities/quant-test-suite';
import { IServiceRepo } from '../services/i-service-repo';
import { ExecutionType } from '../value-types/execution-type';

export interface TestSuiteUpdateDto {
  activated?: boolean;
  threshold?: number;
  cron?: string;
  executionType?: ExecutionType;
  importanceSensitivity?: number;
}

export interface TestSuiteQueryDto {
  activated?: boolean;
  ids?: string[];
}

export type ITestSuiteRepo = IServiceRepo<
  TestSuite,
  TestSuiteQueryDto,
  TestSuiteUpdateDto
>;
