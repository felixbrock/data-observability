import { CustomTestType } from '../entities/custom-test-suite';

export interface AnomalyData {
  importance: number;
}

export interface CustomTestTestData {
  executedOn: string;
  detectedValue: number;
  expectedUpperBound: number;
  expectedLowerBound: number;
  modifiedZScore: number;
  deviation: number;
  anomaly: AnomalyData;
}

export interface CustomTestAlertData {
  alertId: string;
  message: string;
  expectedValue: number;
}

export interface CustomTestExecutionResultDto {
  testSuiteId: string;
  testType: CustomTestType;
  name: string;
  executionId: string;
  isWarmup: boolean;
  testData?: CustomTestTestData;
  alertData?: CustomTestAlertData;
  targetResourceIds?: string[];
  organizationId: string;
  lastAlertSent?: string;
}
