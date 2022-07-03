import { TestSuite } from '../entities/test-suite';
import { DbConnection } from '../services/i-db';
import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { ITestSuiteRepo, TestSuiteQueryDto } from './i-test-suite-repo';

export interface ReadTestSuitesRequestDto {
  job: { frequency: string };
}

export interface ReadTestSuitesAuthDto {
  isCronJobRequest: boolean;
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
      if(!auth.isCronJobRequest) throw new Error('Unauthorized call'); 

      this.#dbConnection = dbConnection;

      const testSuites: TestSuite[] = await this.#testSuiteRepo.findBy(
        this.#buildTestSuiteQueryDto(request),
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
  ): TestSuiteQueryDto => {

    const queryDto: TestSuiteQueryDto = {
      job: { frequency: request.job.frequency },
    };

    // todo - add organizationId
    // queryDto.organizationId = organizationId;

    return queryDto;
  };
}
