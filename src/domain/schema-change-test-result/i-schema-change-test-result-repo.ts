import { SchemaChangeTestResult } from '../value-types/schema-change-test-result';
import { DbConnection} from '../services/i-db';

export interface ISchemaChangeTestResultRepo {
  insertOne(
    schemaChangeTestResult: SchemaChangeTestResult,
    dbConnection: DbConnection,
  ): Promise<string>;
}
