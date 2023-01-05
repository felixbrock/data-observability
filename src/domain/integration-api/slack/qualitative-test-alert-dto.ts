import { QualTestType } from "../../entities/qualitative-test-suite";

export interface QualTestAlertDto {
  alertId: string;
  testType: QualTestType;
  message: string;
  detectedOn: string;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  schemaDiffs: any;
  resourceId: string;
}