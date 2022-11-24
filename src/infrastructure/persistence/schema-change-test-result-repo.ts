// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import { Db, Document, InsertOneResult } from 'mongodb';
import sanitize from 'mongo-sanitize';

import { INominalTestResultRepo } from '../../domain/nominal-test-result/i-nominal-test-result-repo';
import { NominalTestResult } from '../../domain/value-types/nominal-test-result';

interface NominalTestResultPersistence {
  testSuiteId: string;
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
        throw new Error(
          'NominalTestResult creation failed. Insert not acknowledged'
        );

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };

  #toPersistence = async (
    nominalTestResult: NominalTestResult
  ): Promise<Document> => {
    const persistenceObject: NominalTestResultPersistence = {
      ...nominalTestResult,
    };

    return persistenceObject;
  };
}
