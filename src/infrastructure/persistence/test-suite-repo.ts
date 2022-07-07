import {
  Db,
  DeleteResult,
  Document,
  FindCursor,
  InsertManyResult,
  InsertOneResult,
  ObjectId,
  UpdateResult,
} from 'mongodb';
import sanitize from 'mongo-sanitize';

import {
  ITestSuiteRepo,
  TestSuiteQueryDto,
  TestSuiteUpdateDto,
} from '../../domain/test-suite/i-test-suite-repo';
import {
  createStatisticalModel,
  parseTestType,
  TestSuite,
  TestSuiteProperties,
} from '../../domain/entities/test-suite';
import { Expectation } from '../../domain/value-types/expectation';
import { Job } from '../../domain/value-types/job';
import {
  DataType,
  IStatisticalModel,
} from '../../domain/statistical-model/i-statistical-model';

interface ExpectationPersistence {
  type: string;
  configuration: { [key: string]: string | number };
}

interface StatisticalModelPersistence {
  expectation: ExpectationPersistence;
}

interface JobPersistence {
  frequency: string;
}

interface TestSuitePersistence {
  _id: ObjectId;
  activated: boolean;
  type: string;
  statisticalModel: StatisticalModelPersistence;
  job: JobPersistence;
  targetId: string;
}

interface JobQueryFilter {
  'job.frequency'?: string;
}

interface TestSuiteQueryFilter extends JobQueryFilter {
  targetId?: string;
  activated?: boolean;
}

interface TestSuiteUpdateFilter {
  $set: { [key: string]: unknown };
  $push: { [key: string]: unknown };
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

  #buildFilter = (queryDto: TestSuiteQueryDto): TestSuiteQueryFilter => {
    const filter: TestSuiteQueryFilter = {};

    if (queryDto.activated) filter.activated = queryDto.activated;
    if (queryDto.job) filter['job.frequency'] = queryDto.job.frequency;
    if (queryDto.targetId) filter.targetId = queryDto.targetId;

    return filter;
  };

  findBy = async (
    queryDto: TestSuiteQueryDto,
    dbConnection: Db
  ): Promise<TestSuite[]> => {
    try {
      if (!Object.keys(queryDto).length) return await this.all(dbConnection);

      const result: FindCursor = await dbConnection
        .collection(collectionName)
        .find(this.#buildFilter(sanitize(queryDto)));
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

  #buildUpdateFilter = (
    updateDto: TestSuiteUpdateDto
  ): TestSuiteUpdateFilter => {
    const setFilter: { [key: string]: unknown } = {};
    const pushFilter: { [key: string]: unknown } = {};

    if (updateDto.activated) setFilter.activated = updateDto.activated;

    return { $set: setFilter, $push: pushFilter };
  };

  updateOne = async (
    id: string,
    updateDto: TestSuiteUpdateDto,
    dbConnection: Db
  ): Promise<string> => {
    try {
      const result: Document | UpdateResult = await dbConnection
        .collection(collectionName)
        .updateOne(
          { _id: new ObjectId(sanitize(id)) },
          this.#buildUpdateFilter(sanitize(updateDto))
        );

      if (!result.acknowledged)
        throw new Error('Test suite update failed. Update not acknowledged');

      return result.upsertedId;
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

  #toEntity = (props: TestSuiteProperties): TestSuite => TestSuite.build(props);

  #buildProperties = (testSuite: TestSuitePersistence): TestSuiteProperties => {
    const type = parseTestType(testSuite.type);

    return {
      // eslint-disable-next-line no-underscore-dangle
      id: testSuite._id.toHexString(),
      activated: testSuite.activated,
      statisticalModel: createStatisticalModel(
        type,
        testSuite.statisticalModel.expectation.configuration,
        testSuite.statisticalModel.expectation.type
      ),
      type,
      job: Job.create({ ...testSuite.job }),
      targetId: testSuite.targetId,
    };
  };

  #expectationToPersistence = (
    expectation: Expectation
  ): ExpectationPersistence => ({
    configuration: expectation.configuration,
    type: expectation.type,
  });

  #statisticalModelToPersistence = (
    statisticalModel: IStatisticalModel<DataType>
  ): StatisticalModelPersistence => ({
    expectation: this.#expectationToPersistence(statisticalModel.expectation),
  });

  #jobToPersistence = (job: Job): JobPersistence => ({
    frequency: job.frequency,
  });

  #toPersistence = (testSuite: TestSuite): Document => {
    const persistenceObject: TestSuitePersistence = {
      _id: ObjectId.createFromHexString(testSuite.id),
      activated: testSuite.activated,
      type: testSuite.type,
      statisticalModel: this.#statisticalModelToPersistence(
        testSuite.statisticalModel
      ),
      job: this.#jobToPersistence(testSuite.job),
      targetId: testSuite.targetId,
    };

    return persistenceObject;
  };
}
