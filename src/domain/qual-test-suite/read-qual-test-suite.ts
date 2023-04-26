import Result from '../value-types/transient-types/result';
import { QualTestSuite } from '../entities/qual-test-suite';
import IUseCase from '../services/use-case';
import { IQualTestSuiteRepo } from './i-qual-test-suite-repo';
import QualTestSuiteRepo from '../../infrastructure/persistence/qual-test-suite-repo';
import { IDbConnection } from '../services/i-db';

export interface ReadQualTestSuiteRequestDto {
  id: string;
}

export type ReadQualTestSuiteAuthDto = {
  callerOrgId: string;
};

export type ReadQualTestSuiteResponseDto = Result<QualTestSuite | null>;

export class ReadQualTestSuite
  implements
    IUseCase<
      ReadQualTestSuiteRequestDto,
      ReadQualTestSuiteResponseDto,
      ReadQualTestSuiteAuthDto,
      IDbConnection
    >
{
  readonly #repo: IQualTestSuiteRepo;

  constructor(qualTestSuiteRepo: QualTestSuiteRepo) {
    this.#repo = qualTestSuiteRepo;
  }

  async execute(props: {
    req: ReadQualTestSuiteRequestDto;
    auth: ReadQualTestSuiteAuthDto;
    dbConnection: IDbConnection;
  }): Promise<ReadQualTestSuiteResponseDto> {
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
