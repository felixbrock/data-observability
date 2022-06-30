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

import { IJobRepo, JobQueryDto } from '../../domain/job/i-job-repo';
import { Job, JobPrototype } from '../../domain/entities/job';

interface JobPersistence {
  _id: ObjectId;
  frequency: string;
  testSuiteId: string;
}

interface JobQueryFilter {
  frequency: string;
}

const collectionName = 'job';

export default class JobRepo implements IJobRepo {
  findOne = async (id: string, dbConnection: Db): Promise<Job | null> => {
    try {
      const result: any = await dbConnection
        .collection(collectionName)
        .findOne({ _id: new ObjectId(sanitize(id)) });

      if (!result) return null;

      return this.#toEntity(this.#buildPrototype(result));
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  findBy = async (
    jobQueryDto: JobQueryDto,
    dbConnection: Db
  ): Promise<Job[]> => {
    try {
      if (!Object.keys(jobQueryDto).length) return await this.all(dbConnection);

      const result: FindCursor = await dbConnection
        .collection(collectionName)
        .find(this.#buildFilter(sanitize(jobQueryDto)));
      const results = await result.toArray();

      if (!results || !results.length) return [];

      return results.map((element: any) =>
        this.#toEntity(this.#buildPrototype(element))
      );
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  #buildFilter = (jobQueryDto: JobQueryDto): JobQueryFilter => {
    const filter: JobQueryFilter = { frequency: jobQueryDto.frequency };

    return filter;
  };

  all = async (dbConnection: Db): Promise<Job[]> => {
    try {
      const result: FindCursor = await dbConnection
        .collection(collectionName)
        .find();
      const results = await result.toArray();

      if (!results || !results.length) return [];

      return results.map((element: any) =>
        this.#toEntity(this.#buildPrototype(element))
      );
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  insertOne = async (job: Job, dbConnection: Db): Promise<string> => {
    try {
      const result: InsertOneResult<Document> = await dbConnection
        .collection(collectionName)
        .insertOne(this.#toPersistence(sanitize(job)));

      if (!result.acknowledged)
        throw new Error('Job creation failed. Insert not acknowledged');

      return result.insertedId.toHexString();
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  insertMany = async (jobs: Job[], dbConnection: Db): Promise<string[]> => {
    try {
      const result: InsertManyResult<Document> = await dbConnection
        .collection(collectionName)
        .insertMany(
          jobs.map((element) => this.#toPersistence(sanitize(element)))
        );

      if (!result.acknowledged)
        throw new Error('Job creations failed. Inserts not acknowledged');

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
        throw new Error('Job delete failed. Delete not acknowledged');

      return result.deletedCount.toString();
    } catch (error: unknown) {
      if (typeof error === 'string') return Promise.reject(error);
      if (error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };

  #toEntity = (jobProperties: JobPrototype): Job => Job.create(jobProperties);

  #buildPrototype = (job: JobPersistence): JobPrototype => ({
    // eslint-disable-next-line no-underscore-dangle
    id: job._id.toHexString(),
    frequency: job.frequency,
    testSuiteId: job.testSuiteId,
  });

  #toPersistence = (job: Job): Document => ({
    _id: ObjectId.createFromHexString(job.id),
    frequency: job.frequency,
    testSuiteId: job.testSuiteId,
  });
}
