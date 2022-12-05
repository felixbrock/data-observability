import { ExecutionType } from "../execution-type";

export interface BaseTestSuite{
  id: string;
  activated: boolean;
  executionFrequency: number;
  cron?: string;
  executionType: ExecutionType;
}

export interface BaseAnomalyTestSuite extends BaseTestSuite{
  threshold: number;
}