import { DataValidationDto } from "./data-validation-dto";

export type DataValidationResultDto = {[key: string]: any}

export interface IDataValidationApiRepo {
  validate(validationDto: DataValidationDto): Promise<DataValidationResultDto>;
}