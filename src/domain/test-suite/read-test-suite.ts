import { Document } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { TestSuite } from '../entities/quant-test-suite';
import { ITestSuiteRepo } from './i-test-suite-repo';
import TestSuiteRepo from '../../infrastructure/persistence/test-suite-repo';
import { IDbConnection } from '../services/i-db';

export interface ReadTestSuiteRequestDto {
  id?: string;
  targetResourceId?: string;
  activated?: boolean;
}

export type ReadTestSuiteAuthDto = {
  callerOrgId: string;
};

export type ReadTestSuiteResponseDto = Result<TestSuite | Document[] | null>;

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
      if (req.id) {
        const testSuite = await this.#repo.findOne(req.id, dbConnection, auth.callerOrgId);
        return Result.ok(testSuite);
      }

      if (!req.targetResourceId || !req.activated) {
        throw new Error('Missing target resource ids or activated');
      }

      const query = {
        targetResourceIds: [req.targetResourceId],
        activated: req.activated,
        deleted: false
      };

      const results = await this.#repo.findBy(query, dbConnection, auth.callerOrgId, false);
      return Result.ok(results);

    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
