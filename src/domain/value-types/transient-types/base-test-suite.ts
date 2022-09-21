export interface BaseTestSuite{
  id: string;
  organizationId: string;
  activated: boolean;
  executionFrequency: number;
  cron?: string;
}

export interface BaseAnomalyTestSuite extends BaseTestSuite{
  threshold: number;
}