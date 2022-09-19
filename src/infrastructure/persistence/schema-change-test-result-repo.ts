// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import { Db, Document, InsertOneResult } from 'mongodb';
import sanitize from 'mongo-sanitize';

import { ISchemaChangeTestResultRepo } from '../../domain/schema-change-test-result/i-schema-change-test-result-repo';
import { SchemaChangeTestResult } from '../../domain/value-types/schema-change-test-result';
import { TestType } from '../../domain/entities/test-suite';

interface SchemaChangeTestResultPersistence {
  testSuiteId: string;
  testType: TestType;
  executionId: string;
  testData?: {
    executedOn: string;
    isAnomolous: boolean;
    schemaDiffs: any;
  };
  alertData?: {
    alertId: string;
  };
  targetResourceId: string;
  organizationId: string;
}

const collectionName = 'schemaChangeTestResult';

export default class SchemaChangeTestResultRepo implements ISchemaChangeTestResultRepo {
  insertOne = async (
    schemaChangeTestResult: SchemaChangeTestResult,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(await this.#toPersistence(sanitize(schemaChangeTestResult)));

      if (!result.acknowledged)
        throw new Error('SchemaChangeTestResult creation failed. Insert not acknowledged');

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  #toPersistence = async (schemaChangeTestResult: SchemaChangeTestResult): Promise<Document> => {
    const persistenceObject: SchemaChangeTestResultPersistence = {
      ...schemaChangeTestResult,
    };

    return persistenceObject;
  };
}
