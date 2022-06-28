// todo - clean architecture violation
import { ObjectId } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import {
  Job,
} from '../entities/job';

export interface CreateJobRequestDto {
  frequency: number
}

export interface CreateJobAuthDto {
  organizationId: string;
}

export type CreateJobResponseDto = Result<Job>;

export class CreateJob
  implements
    IUseCase<
      CreateJobRequestDto,
      CreateJobResponseDto,
      CreateJobAuthDto
    >
{
  async execute(
    request: CreateJobRequestDto,
    auth: CreateJobAuthDto
  ): Promise<CreateJobResponseDto> {
    console.log(auth);
    
    try {
      const job = Job.create({
        localId: new ObjectId().toHexString(),
        frequency: request.frequency
      });

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
