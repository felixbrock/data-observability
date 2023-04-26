import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { TestSuite } from '../entities/quant-test-suite';
import { ITestSuiteRepo } from './i-test-suite-repo';
import TestSuiteRepo from '../../infrastructure/persistence/test-suite-repo';
import { IDbConnection } from '../services/i-db';

export interface ReadTestSuiteRequestDto {
  id: string;
}

export type ReadTestSuiteAuthDto = {
  callerOrgId: string;
};

export type ReadTestSuiteResponseDto = Result<TestSuite | null>;

export class ReadTestSuite
  implements
    IUseCase<
      ReadTestSuiteRequestDto,
      ReadTestSuiteResponseDto,
      ReadTestSuiteAuthDto,
      IDbConnection
    >
{
  readonly #repo: ITestSuiteRepo;

  constructor(testSuiteRepo: TestSuiteRepo) {
    this.#repo = testSuiteRepo;
  }

  async execute(props: {
    req: ReadTestSuiteRequestDto;
    auth: ReadTestSuiteAuthDto;
    dbConnection: IDbConnection;
  }): Promise<ReadTestSuiteResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      const testSuite = await this.#repo.findOne(req.id, dbConnection, auth.callerOrgId);

      return Result.ok(testSuite);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
