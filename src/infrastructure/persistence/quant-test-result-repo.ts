// use MongoDB: https://www.mongodb.com/docs/manual/core/csfle/

import { Db, Document, InsertOneResult } from 'mongodb';
import sanitize from 'mongo-sanitize';

import { IQuantTestResultRepo } from '../../domain/quant-test-result/i-quant-test-result-repo';
import { QuantTestResult } from '../../domain/value-types/quant-test-result';

type QuantTestResultPersistence = QuantTestResult;

const collectionName = 'quantTestResult';

export default class QuantTestResultRepo implements IQuantTestResultRepo {
  insertOne = async (
    quantTestResult: QuantTestResult,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(await this.#toPersistence(sanitize(quantTestResult)));

      if (!result.acknowledged)
        throw new Error(
          'QuantTestResult creation failed. Insert not acknowledged'
        );

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };

  #toPersistence = async (
    quantTestResult: QuantTestResult
  ): Promise<Document> => {
    const persistenceObject: QuantTestResultPersistence = {
      ...quantTestResult,
    };

    return persistenceObject;
  };
}
