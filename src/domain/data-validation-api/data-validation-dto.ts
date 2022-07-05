export type ExpectationConfiguration = {
  [key: string]: number | string | boolean;
};
export type Data = { [key: string]: number[] };
export interface DataValidationDto {
  expectationType: string;
  expectationConfiguration: ExpectationConfiguration;
  data: Data;
};

