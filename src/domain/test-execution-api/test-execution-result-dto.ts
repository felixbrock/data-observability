export interface TestExecutionResultDto {
  testSuiteId: string;
  testType: string;
  executionId: string;
  executedOn: string;
  isAnomolous: boolean;
  alertSpecificData?: {
    alertId: string;
    message: string;
    value: number;
    expectedUpperBound: number;
    expectedLowerBound: number;
    materializationAddress: string;
    columnName?: string;
  };
  threshold: number;
  executionFrequency: number;
  modifiedZScore: number;
  deviation: number;
  organizationId: string;
}
