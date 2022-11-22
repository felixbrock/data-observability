import { AnomalyTestResult } from '../value-types/anomaly-test-result';
import { IDbConnection} from '../services/i-db';

export interface IAnomalyTestResultRepo {
  insertOne(
    anomalyTestResult: AnomalyTestResult,
    dbConnection: IDbConnection,
  ): Promise<string>;
}
