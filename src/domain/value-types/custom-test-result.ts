export interface CustomTestResult {
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
    organizationId: string;
    lastAlertSent?: string;
  }