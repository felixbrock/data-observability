import { ExecutionType } from "../execution-type";

interface BaseTestSuite{
  id: string;
  activated: boolean;
  cron: string;
  executionType: ExecutionType;
}

export interface BaseQuantTestSuite extends BaseTestSuite{
  threshold: number;
}

export type BaseQualTestSuite = BaseTestSuite;