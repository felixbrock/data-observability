import { QuantitativeTestResult } from '../value-types/quantitative-test-result';
import { IDbConnection} from '../services/i-db';

export interface IQuantitativeTestResultRepo {
  insertOne(
    quantitativeTestResult: QuantitativeTestResult,
    dbConnection: IDbConnection,
  ): Promise<string>;
}
