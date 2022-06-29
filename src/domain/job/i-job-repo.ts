import { Job } from '../entities/job';
import { DbConnection } from '../services/i-db';

export interface JobQueryDto {
  frequency: string;
}

export interface IJobRepo {
  findOne(id: string, dbConnection: DbConnection): Promise<Job | null>;
  findBy(queryDto: JobQueryDto, dbConnection: DbConnection): Promise<Job[]>;
  all(dbConnection: DbConnection): Promise<Job[]>;
  insertOne(job: Job, dbConnection: DbConnection): Promise<string>;
  insertMany(jobs: Job[], dbConnection: DbConnection): Promise<string[]>;
  deleteOne(id: string, dbConnection: DbConnection): Promise<string>;
}
