import { TestType } from "../../entities/test-suite";

export interface QuantitativeAlertDto {
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