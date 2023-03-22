// todo - evaluate. approach to replace tedious work of working with classes. Imo does not violate Clean architecture & DDD
export interface QuantTestResult {
  testSuiteId: string;
  executionId: string;
  isWarmup: boolean;
  testData?: {
    executedOn: string;
    detectedValue: number;
    expectedUpperBound: number;
    expectedLowerBound: number;
    anomaly?: {
      importance: number;
    };
    modifiedZScore: number;
    deviation: number;
  };
  alertData?: {
    alertId: string;
  };
  targetResourceId: string;
  organizationId: string;
}
