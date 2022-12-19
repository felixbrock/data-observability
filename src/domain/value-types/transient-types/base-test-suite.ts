import { ExecutionType } from "../execution-type";

export interface BaseTestSuite{
  id: string;
  activated: boolean;
  cron: string;
  executionType: ExecutionType;
}

export interface BaseAnomalyTestSuite extends BaseTestSuite{
  threshold: number;
}