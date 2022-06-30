import { Job } from '../entities/job';

export interface JobDto {
  id: string;
  frequency: string;
  testSuiteId: string;
}

export const buildJobDto = (job: Job): JobDto => ({
  id: job.id,
  frequency: job.frequency,
  testSuiteId: job.testSuiteId,
});
