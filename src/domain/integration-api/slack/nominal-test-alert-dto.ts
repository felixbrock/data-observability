import { QualitativeTestType } from "../../entities/qualitative-test-suite";

export interface QualitativeTestAlertDto {
  alertId: string;
  testType: QualitativeTestType;
  message: string;
  detectedOn: string;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  schemaDiffs: any;
  resourceId: string;
}