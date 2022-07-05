import { Db, Document, InsertOneResult, ObjectId } from 'mongodb';
import sanitize from 'mongo-sanitize';

import { IDataValidationResultRepo } from '../../domain/data-validation-result/i-data-validation-result-repo';
import {
  DataValidationResult,
  DataValidationResultProperties,
} from '../../domain/value-types/data-validation-result';

interface DataValidationResultPersistence {
  testSuiteId: string;
  testEngineResult: { [key: string | number | symbol]: unknown };
}

const collectionName = 'dataValidationResult';

export default class DataValidationResultRepo
  implements IDataValidationResultRepo
{
  findOne = async (
    id: string,
    dbConnection: Db
  ): Promise<DataValidationResult | null> => {
    try {
      const result: any = await dbConnection
        .collection(collectionName)
        .findOne({ _id: new ObjectId(sanitize(id)) });

      if (!result) return null;

      return this.#toEntity(this.#buildProperties(result));
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  insertOne = async (
    dataValidationResult: DataValidationResult,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(this.#toPersistence(sanitize(dataValidationResult)));

      if (!result.acknowledged)
        throw new Error(
          'DataValidationResult creation failed. Insert not acknowledged'
        );

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  #toEntity = (
    properties: DataValidationResultProperties
  ): DataValidationResult => DataValidationResult.create(properties);

  #buildProperties = (
    dataValidationResult: DataValidationResultPersistence
  ): DataValidationResultProperties => ({
    testSuiteId: dataValidationResult.testSuiteId,
    testEngineResult: dataValidationResult.testEngineResult,
  });

  #toPersistence = (dataValidationResult: DataValidationResult): Document => {
    const persistenceObject: DataValidationResultPersistence = {
      testSuiteId: dataValidationResult.testSuiteId,
      testEngineResult: dataValidationResult.testEngineResult,
    };

    return persistenceObject;
  };
}
