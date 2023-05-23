import { Document } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDbConnection } from '../services/i-db';
import CustomQueryRepo from '../../infrastructure/persistence/custom-query-repo';
import { ICustomQueryRepo } from './i-custom-query-repo';

export interface ReadAlertHistoryRequestDto {
  testSuiteIds: string[];
}

export type ReadAlertHistoryAuthDto = {
  callerOrgId: string;
};

export type ReadAlertHistoryResponseDto = Result<Document[] | null>;

export class ReadAlertHistory
  implements
    IUseCase<
      ReadAlertHistoryRequestDto,
      ReadAlertHistoryResponseDto,
      ReadAlertHistoryAuthDto,
      IDbConnection
    >
{
  readonly #repo: ICustomQueryRepo;

  constructor(customQueryRepo: CustomQueryRepo) {
    this.#repo = customQueryRepo;
  }

  async execute(props: {
    req: ReadAlertHistoryRequestDto;
    auth: ReadAlertHistoryAuthDto;
    dbConnection: IDbConnection;
  }): Promise<ReadAlertHistoryResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      const results = await this.#repo.readAlertHistory(
        req.testSuiteIds,
        dbConnection,
        auth.callerOrgId
      );

      return Result.ok(results);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
