import { DataValidationDto } from "./data-validation-dto";

export type DataValidationResultDto = {[key: string]: unknown}

export interface IDataValidationApiRepo {
  validate(validationDto: DataValidationDto): Promise<DataValidationResultDto>;
}