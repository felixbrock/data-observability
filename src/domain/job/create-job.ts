// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { Frequency, Job } from '../entities/job';
import { DbConnection } from '../services/i-db';
import JobRepo from '../../infrastructure/persistence/job-repo';

export interface CreateJobRequestDto {
  frequency: Frequency;
  testSuiteId: string;
}

export interface CreateJobAuthDto {
  organizationId: string;
}

export type CreateJobResponseDto = Result<Job>;

export class CreateJob
  implements
    IUseCase<CreateJobRequestDto, CreateJobResponseDto, CreateJobAuthDto, DbConnection>
{
  readonly #jobRepo: JobRepo;

  #dbConnection: DbConnection;

  constructor(
    jobRepo: JobRepo
  ) {
    this.#jobRepo = jobRepo;
  }


  async execute(
    request: CreateJobRequestDto,
    auth: CreateJobAuthDto,
    dbConnection: DbConnection
  ): Promise<CreateJobResponseDto> {
    console.log(auth);

    try {
      this.#dbConnection = dbConnection;

      const job = Job.create({
        id: new ObjectId().toHexString(),
        frequency: request.frequency,
        testSuiteId: request.testSuiteId,
      });

      await this.#jobRepo.insertOne(job, this.#dbConnection);

      // if (auth.organizationId !== 'TODO')
      //   throw new Error('Not authorized to perform action');

      return Result.ok(job);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
