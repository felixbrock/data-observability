import { Document } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDbConnection } from '../services/i-db';
import TestHistoryRepo from '../../infrastructure/persistence/test-history-repo';

export interface ReadTestHistoryRequestDto {
  testSuiteIds: string[]
}

export type ReadTestHistoryAuthDto = {
  callerOrgId: string;
};

export type ReadTestHistoryResponseDto = Result<Document[] | null>;

export class ReadTestHistory
  implements
    IUseCase<
      ReadTestHistoryRequestDto,
      ReadTestHistoryResponseDto,
      ReadTestHistoryAuthDto,
      IDbConnection
    >
{

  readonly #repo: TestHistoryRepo;

  constructor(
    testHistoryRepo: TestHistoryRepo
  ) {
    this.#repo = testHistoryRepo;
  }

  async execute(props: {
    req: ReadTestHistoryRequestDto;
    auth: ReadTestHistoryAuthDto;
    dbConnection: IDbConnection;
  }): Promise<ReadTestHistoryResponseDto> {
    const { req, auth, dbConnection } = props;

    try {

      const results = await this.#repo.readTestHistory(req.testSuiteIds, dbConnection, auth.callerOrgId);

      return Result.ok(results);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}