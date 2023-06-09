import Result from '../value-types/transient-types/result';
import { ICustomTestSuiteRepo } from './i-custom-test-suite-repo';
import IUseCase from '../services/use-case';
// import { deleteSchedules } from '../services/schedule';
import { IDbConnection } from '../services/i-db';
import { deleteSchedules } from '../services/schedule';

export type Mode = 'soft' | 'hard';

export const parseMode = (obj: unknown): Mode => {
  if (typeof obj !== 'string') throw new Error('Provision of invalid type');

  switch (obj) {
    case 'soft':
      return 'soft';
    case 'hard':
      return 'hard';
    default:
      throw new Error('Provision of invalid type');
  }
};

export interface DeleteCustomTestSuiteRequestDto {
  id: string;
  mode: Mode;
}

export type DeleteCustomTestSuiteAuthDto = {
  callerOrgId: string;
};

export type DeleteCustomTestSuiteResponseDto = Result<null>;

export class DeleteCustomTestSuite
  implements
    IUseCase<
      DeleteCustomTestSuiteRequestDto,
      DeleteCustomTestSuiteResponseDto,
      DeleteCustomTestSuiteAuthDto,
      IDbConnection
    >
{
  readonly #repo: ICustomTestSuiteRepo;

  constructor(customTestSuiteRepo: ICustomTestSuiteRepo) {
    this.#repo = customTestSuiteRepo;
  }

  async execute(props: {
    req: DeleteCustomTestSuiteRequestDto;
    auth: DeleteCustomTestSuiteAuthDto;
    dbConnection: IDbConnection;
  }): Promise<DeleteCustomTestSuiteResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      switch (req.mode) {
        case 'soft':
          await this.#repo.softDeleteOne(
            req.id, dbConnection, auth.callerOrgId
          );
          break;
        case 'hard':
          throw new Error('Hard delete not implemented yet');
        default:
          throw new Error('Received unknown test suite deletion mode');
      }

      await deleteSchedules(auth.callerOrgId, [req.id]);

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}