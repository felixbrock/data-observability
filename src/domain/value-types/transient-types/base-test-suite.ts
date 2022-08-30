export interface BaseTestSuite{
  id: string;
  organizationId: string;
  activated: boolean;
  threshold: number;
  executionFrequency: number;
}