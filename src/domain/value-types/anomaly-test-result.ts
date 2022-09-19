import { TestType } from '../entities/test-suite';

// todo - evaluate. approach to replace tedious work of working with classes. Imo does not violate Clean architecture & DDD
export interface AnomalyTestResult {
  testSuiteId: string;
  testType: TestType;
  threshold: number;
  executionFrequency: number;
  executionId: string;
  isWarmup: boolean;
  testData?: {
    executedOn: string;
    isAnomolous: boolean;
    modifiedZScore: number;
    deviation: number;
  };
  alertData?: {
    alertId: string;
  };
  targetResourceId: string;
  organizationId: string;
}
