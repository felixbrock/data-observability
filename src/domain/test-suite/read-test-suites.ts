import { TestSuite } from '../entities/test-suite';
import { DbConnection } from '../services/i-db';
import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { ITestSuiteRepo, TestSuiteQueryDto } from './i-test-suite-repo';

export interface ReadTestSuitesRequestDto {
  targetId?: string;
  job?: { frequency: string };
}

export interface ReadTestSuitesAuthDto {
  // todo - secure? optional due to organization agnostic cron job requests
  organizationId?: string;
}

export type ReadTestSuitesResponseDto = Result<TestSuite[]>;

export class ReadTestSuites
  implements
    IUseCase<
      ReadTestSuitesRequestDto,
      ReadTestSuitesResponseDto,
      ReadTestSuitesAuthDto,
      DbConnection
    >
{
  readonly #testSuiteRepo: ITestSuiteRepo;

  #dbConnection: DbConnection;

  constructor(testSuiteRepo: ITestSuiteRepo) {
    this.#testSuiteRepo = testSuiteRepo;
  }

  async execute(
    request: ReadTestSuitesRequestDto,
    auth: ReadTestSuitesAuthDto,
    dbConnection: DbConnection
  ): Promise<ReadTestSuitesResponseDto> {
    try {

      this.#dbConnection = dbConnection;

      const testSuites: TestSuite[] = await this.#testSuiteRepo.findBy(
        this.#buildTestSuiteQueryDto(request, auth.organizationId),
        this.#dbConnection
      );
      if (!testSuites) throw new Error(`Queried testSuites do not exist`);

      return Result.ok(testSuites);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }

  #buildTestSuiteQueryDto = (
    request: ReadTestSuitesRequestDto,
    organizationId :string | undefined
  ): TestSuiteQueryDto => {
    console.log(organizationId);
    

    const queryDto: TestSuiteQueryDto = {};

    if (request.job) queryDto.job = {frequency: request.job.frequency};
    if (request.targetId) queryDto.targetId = request.targetId;

    // todo - add organizationId
    // queryDto.organizationId = organizationId;

    return queryDto;
  };
}
