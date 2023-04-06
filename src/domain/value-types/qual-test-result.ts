// todo - evaluate. approach to replace tedious work of working with classes. Imo does not violate Clean architecture & DDD
export interface QualTestResult {
  testSuiteId: string;
  executionId: string;
  testData?: {
    executedOn: string;
    isIdentical: boolean;
    deviations: string;
  };
  alertData?: {
    alertId: string;
  };
  targetResourceId: string;
  organizationId: string;
  lastAlertSent?: string;
}
