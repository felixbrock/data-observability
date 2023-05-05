import Result from '../value-types/transient-types/result';
import { CustomTestSuite } from '../entities/custom-test-suite';
import IUseCase from '../services/use-case';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import CustomTestSuiteRepo from '../../infrastructure/persistence/custom-test-suite-repo';
import { IDbConnection } from '../services/i-db';

export interface ReadCustomTestSuiteRequestDto {
  id: string;
}

export type ReadCustomTestSuiteAuthDto = {
  callerOrgId: string;
};

export type ReadCustomTestSuiteResponseDto = Result<CustomTestSuite | null>;

export class ReadCustomTestSuite
  implements
    IUseCase<
      ReadCustomTestSuiteRequestDto,
      ReadCustomTestSuiteResponseDto,
      ReadCustomTestSuiteAuthDto,
      IDbConnection
    >
{
  readonly #repo: ICustomTestSuiteRepo;

  constructor(customTestSuiteRepo: CustomTestSuiteRepo) {
    this.#repo = customTestSuiteRepo;
  }

  async execute(props: {
    req: ReadCustomTestSuiteRequestDto;
    auth: ReadCustomTestSuiteAuthDto;
    dbConnection: IDbConnection
  }): Promise<ReadCustomTestSuiteResponseDto> {
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
