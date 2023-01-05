import { ExecutionType } from "../execution-type";

interface BaseTestSuite{
  id: string;
  activated: boolean;
  cron: string;
  executionType: ExecutionType;
}

export interface BaseQuantitativeTestSuite extends BaseTestSuite{
  threshold: number;
}

export type QualitativeTestSuite = BaseTestSuite;