import { TestType } from "../../entities/quant-test-suite";

export interface QuantTestAlertDto {
  alertId: string;
  value: number;
  testType: TestType;
  message: string;
  expectedUpperBound: number;
  expectedLowerBound: number;
  detectedOn: string;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  columnName?: string;
  deviation: number;
  resourceId: string;
}