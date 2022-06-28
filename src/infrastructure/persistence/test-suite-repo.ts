import {
  Db,
  DeleteResult,
  Document,
  FindCursor,
  InsertManyResult,
  InsertOneResult,
  ObjectId,
} from 'mongodb';
import sanitize from 'mongo-sanitize';

import { ITestSuiteRepo } from '../../domain/test-suite/i-test-suite-repo';
import {
  TestSuite,
  TestSuiteProperties,
} from '../../domain/entities/test-suite';
import { Expectation } from '../../domain/entities/expectation';
import { Job } from '../../domain/entities/job';

interface ExpectationPersistence {
  localId: string;
  type: string;
  threshold: number;
}

interface JobPersistence {
  localId: string;
  frequency: number;
}

interface TestSuitePersistence {
  _id: ObjectId;
  expectation: ExpectationPersistence;
  job: JobPersistence;
}

const collectionName = 'testSuite';

export default class TestSuiteRepo implements ITestSuiteRepo {
  findOne = async (id: string, dbConnection: Db): Promise<TestSuite | null> => {
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

  all = async (dbConnection: Db): Promise<TestSuite[]> => {
    try {
      const result: FindCursor = await dbConnection
        .collection(collectionName)
        .find();
      const results = await result.toArray();

      if (!results || !results.length) return [];

      return results.map((element: any) =>
        this.#toEntity(this.#buildProperties(element))
      );
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  insertOne = async (
    testSuite: TestSuite,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(this.#toPersistence(sanitize(testSuite)));

      if (!result.acknowledged)
        throw new Error('TestSuite creation failed. Insert not acknowledged');

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  insertMany = async (
    testSuites: TestSuite[],
    dbConnection: Db
  ): Promise<string[]> => {
    try {
      const result: InsertManyResult<Document> = await dbConnection
        .collection(collectionName)
        .insertMany(
          testSuites.map((element) => this.#toPersistence(sanitize(element)))
        );

      if (!result.acknowledged)
        throw new Error('TestSuite creations failed. Inserts not acknowledged');

      return Object.keys(result.insertedIds).map((key) =>
        result.insertedIds[parseInt(key, 10)].toHexString()
      );
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  deleteOne = async (id: string, dbConnection: Db): Promise<string> => {
    try {
      const result: DeleteResult = await dbConnection
        .collection(collectionName)
        .deleteOne({ _id: new ObjectId(sanitize(id)) });

      if (!result.acknowledged)
        throw new Error('TestSuite delete failed. Delete not acknowledged');

      return result.deletedCount.toString();
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  #toEntity = (properties: TestSuiteProperties): TestSuite =>
    TestSuite.create(properties);

  #buildProperties = (
    testSuite: TestSuitePersistence
  ): TestSuiteProperties => ({
    // eslint-disable-next-line no-underscore-dangle
    id: testSuite._id.toHexString(),
    // eslint-disable-next-line no-underscore-dangle
    expectation: Expectation.create({ ...testSuite.expectation }),
    job: Job.create({ ...testSuite.job }),
  });

  #toPersistence = (testSuite: TestSuite): Document => {
    const persistenceObject: TestSuitePersistence = {
      _id: ObjectId.createFromHexString(testSuite.id),
      expectation: {
        localId: testSuite.expectation.localId,
        threshold: testSuite.expectation.threshold,
        type: testSuite.expectation.type,
      },
      job: {
        localId: testSuite.job.localId,
        frequency: testSuite.job.frequency,
      },
    };

    return persistenceObject;
  };
}
