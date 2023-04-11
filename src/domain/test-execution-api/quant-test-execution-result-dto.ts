import { TestType } from '../entities/quant-test-suite';
import { MaterializationType } from '../value-types/materialization-type';

export interface AnomalyData {
  importance: number;
}

export interface QuantTestTestData {
  executedOn: string;
  detectedValue: number;
  expectedUpperBound: number;
  expectedLowerBound: number;
  modifiedZScore: number;
  deviation: number;
  anomaly: AnomalyData;
}

export interface QuantTestAlertData {
  alertId: string;
  message: string;
  expectedValue: number;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
}

export interface QuantTestExecutionResultDto {
  testSuiteId: string;
  testType: TestType;
  executionId: string;
  isWarmup: boolean;
  testData?: QuantTestTestData;
  alertData?: QuantTestAlertData;
  targetResourceId: string;
  organizationId: string;
  lastAlertSent?: string;
}
