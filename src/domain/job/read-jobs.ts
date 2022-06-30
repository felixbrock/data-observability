import { Job } from '../entities/job';
import { DbConnection } from '../services/i-db';
import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { IJobRepo, JobQueryDto } from './i-job-repo';

export interface ReadJobsRequestDto {
  frequency: string;
}

export interface ReadJobsAuthDto {
  organizationId: string;
}

export type ReadJobsResponseDto = Result<Job[]>;

export class ReadJobs
  implements
    IUseCase<
      ReadJobsRequestDto,
      ReadJobsResponseDto,
      ReadJobsAuthDto,
      DbConnection
    >
{
  readonly #jobRepo: IJobRepo;

  #dbConnection: DbConnection;

  constructor(jobRepo: IJobRepo) {
    this.#jobRepo = jobRepo;
  }

  async execute(
    request: ReadJobsRequestDto,
    auth: ReadJobsAuthDto,
    dbConnection: DbConnection
  ): Promise<ReadJobsResponseDto> {
    try {
      this.#dbConnection = dbConnection;

      const jobs: Job[] = await this.#jobRepo.findBy(
        this.#buildJobQueryDto(request, auth.organizationId),
        this.#dbConnection
      );
      if (!jobs) throw new Error(`Queried jobs do not exist`);

      return Result.ok(jobs);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }

  #buildJobQueryDto = (
    request: ReadJobsRequestDto,
    organizationId: string
  ): JobQueryDto => {
    console.log(organizationId);

    const queryDto: JobQueryDto = { frequency: request.frequency };

    // todo - add organizationId
    // queryDto.organizationId = organizationId;

    return queryDto;
  };
}
