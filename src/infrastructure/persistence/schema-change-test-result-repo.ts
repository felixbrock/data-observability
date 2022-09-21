// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import { Db, Document, InsertOneResult } from 'mongodb';
import sanitize from 'mongo-sanitize';

import { INominalTestResultRepo } from '../../domain/nominal-test-result/i-nominal-test-result-repo';
import { NominalTestResult } from '../../domain/value-types/nominal-test-result';
import { TestType } from '../../domain/entities/test-suite';

interface NominalTestResultPersistence {
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

const collectionName = 'nominalTestResult';

export default class NominalTestResultRepo implements INominalTestResultRepo {
  insertOne = async (
    nominalTestResult: NominalTestResult,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(await this.#toPersistence(sanitize(nominalTestResult)));

      if (!result.acknowledged)
        throw new Error('NominalTestResult creation failed. Insert not acknowledged');

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  #toPersistence = async (nominalTestResult: NominalTestResult): Promise<Document> => {
    const persistenceObject: NominalTestResultPersistence = {
      ...nominalTestResult,
    };

    return persistenceObject;
  };
}
