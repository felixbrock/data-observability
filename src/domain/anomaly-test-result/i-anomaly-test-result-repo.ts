import { AnomalyTestResult } from '../value-types/anomaly-test-result';
import { DbConnection} from '../services/i-db';

export interface IAnomalyTestResultRepo {
  insertOne(
    anomalyTestResult: AnomalyTestResult,
    dbConnection: DbConnection,
  ): Promise<string>;
}
