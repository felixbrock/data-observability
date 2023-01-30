import { ExecutionType } from '../execution-type';

export interface BaseTestSuite {
  id: string;
  activated: boolean;
  cron: string;
  executionType: ExecutionType;
  deleted: boolean;
  deletedAt?: string;
}

export interface BaseQuantTestSuite extends BaseTestSuite {
  threshold: number;
  importanceThreshold: number;
  boundsIntervalRelative: number;
}
