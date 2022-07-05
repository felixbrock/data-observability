import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { ITestSuiteRepo } from './i-test-suite-repo';
import { TestSuite } from '../entities/test-suite';
import { DbConnection } from '../services/i-db';

export interface ReadTestSuiteRequestDto {
  id: string;
}

export interface ReadTestSuiteAuthDto {
  organizationId: string;
}

export type ReadTestSuiteResponseDto = Result<TestSuite>;

export class ReadTestSuite
  implements
    IUseCase<
      ReadTestSuiteRequestDto,
      ReadTestSuiteResponseDto,
      ReadTestSuiteAuthDto,
      DbConnection
    >
{
  readonly #testSuiteRepo: ITestSuiteRepo;

  #dbConnection: DbConnection;

  constructor(testSuiteRepo: ITestSuiteRepo) {
    this.#testSuiteRepo = testSuiteRepo;
  }

  async execute(
    request: ReadTestSuiteRequestDto,
    auth: ReadTestSuiteAuthDto,
    dbConnection: DbConnection
  ): Promise<ReadTestSuiteResponseDto> {
    try {
      // todo -replace
      console.log(auth);

      this.#dbConnection = dbConnection;

      const testSuite = await this.#testSuiteRepo.findOne(
        request.id,
        this.#dbConnection
      );
      if (!testSuite) throw new Error(`TestSuite with id ${request.id} does not exist`);

      // if (testSuite.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(testSuite);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
