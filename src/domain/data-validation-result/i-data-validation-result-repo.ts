import { DbConnection } from '../services/i-db';
import {DataValidationResult} from '../value-types/data-validation-result';

export interface IDataValidationResultRepo {
  findOne(id: string, dbConnection: DbConnection): Promise<DataValidationResult | null>;
  insertOne(dataValidationResult: DataValidationResult, dbConnection: DbConnection): Promise<string>;
}
