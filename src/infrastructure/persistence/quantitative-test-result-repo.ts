// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import { Db, Document, InsertOneResult } from 'mongodb';
import sanitize from 'mongo-sanitize';

import { IQuantitativeTestResultRepo } from '../../domain/quantitative-test-result/i-quantitative-test-result-repo';
import { QuantitativeTestResult } from '../../domain/value-types/quantitative-test-result';

interface QuantitativeTestResultPersistence {
  testSuiteId: string;
  executionId: string;
  isWarmup: boolean;
  testData?: {
    executedOn: string;
    isAnomolous: boolean;
    modifiedZScore: number;
    deviation: number;
  };
  alertData?: {
    alertId: string;
  };
  targetResourceId: string;
  organizationId: string;
}

const collectionName = 'quantitativeTestResult';

export default class QuantitativeTestResultRepo implements IQuantitativeTestResultRepo {
  insertOne = async (
    quantitativeTestResult: QuantitativeTestResult,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(await this.#toPersistence(sanitize(quantitativeTestResult)));

      if (!result.acknowledged)
        throw new Error('QuantitativeTestResult creation failed. Insert not acknowledged');

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if(error instanceof Error ) console.error(error.stack); 
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };

  #toPersistence = async (quantitativeTestResult: QuantitativeTestResult): Promise<Document> => {
    const persistenceObject: QuantitativeTestResultPersistence = {
      ...quantitativeTestResult,
    };

    return persistenceObject;
  };
}
