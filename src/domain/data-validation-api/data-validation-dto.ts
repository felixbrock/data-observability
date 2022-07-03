export type ExpectationConfiguration = {
  [key: string]: number | string | boolean;
};
export type Data = { [key: string]: number[] };
export type DataValidationDto = {
  expectationType: string;
  expectationConfiguration: ExpectationConfiguration;
  data: Data;
};

