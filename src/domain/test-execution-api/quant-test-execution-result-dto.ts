import { TestType } from '../entities/quant-test-suite';
import { MaterializationType } from '../value-types/materialization-type';

export interface AnomalyData {
  isAnomaly: boolean;
  importance?: number;
  boundsIntervalRelative?: number;
}

export interface QuantTestTestData {
  executedOn: string;
  modifiedZScore: number;
  deviation: number;
  anomaly: AnomalyData;
}

export interface QuantTestAlertData {
  alertId: string;
  message: string;
  value: number;
  expectedUpperBound: number;
  expectedLowerBound: number;
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
}
