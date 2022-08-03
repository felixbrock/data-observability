export interface AlertDto {
  value: number;
  message: string;
  expectedUpperBound: number;
  expectedLowerBound: number;
  detectedOn: string;
  materializationAddress: string;
  columnName?: string;
  deviation: number;
  organizationId: string;
}