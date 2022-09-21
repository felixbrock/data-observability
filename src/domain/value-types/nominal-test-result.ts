import { TestType } from '../entities/test-suite';

// todo - evaluate. approach to replace tedious work of working with classes. Imo does not violate Clean architecture & DDD
export interface NominalTestResult {
  testSuiteId: string;
  testType: TestType;
  executionId: string;
  testData?: {
    executedOn: string;
    isAnomolous: boolean;
    schemaDiffs: string;
  };
  alertData?: {
    alertId: string;
  };
  targetResourceId: string;
  organizationId: string;
}
