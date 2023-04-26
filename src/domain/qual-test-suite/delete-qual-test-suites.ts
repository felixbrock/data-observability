import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { deleteSchedules } from '../services/schedule';
import { IQualTestSuiteRepo } from './i-qual-test-suite-repo';
import { IDbConnection } from '../services/i-db';

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

export interface DeleteQualTestSuitesRequestDto {
  targetResourceIds: string[];
  mode: Mode;
}

export type DeleteQualTestSuitesAuthDto = {
  callerOrgId: string;
};

export type DeleteQualTestSuitesResponseDto = Result<null>;

export class DeleteQualTestSuites
  implements
    IUseCase<
      DeleteQualTestSuitesRequestDto,
      DeleteQualTestSuitesResponseDto,
      DeleteQualTestSuitesAuthDto,
      IDbConnection
    >
{
  readonly #repo: IQualTestSuiteRepo;

  constructor(qualTestSuiteRepo: IQualTestSuiteRepo) {
    this.#repo = qualTestSuiteRepo;
  }

  async execute(props: {
    req: DeleteQualTestSuitesRequestDto;
    auth: DeleteQualTestSuitesAuthDto;
    dbConnection: IDbConnection;
  }): Promise<DeleteQualTestSuitesResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      switch (req.mode) {
        case 'soft':
          await this.#repo.softDeleteMany(
            { targetResourceIds: req.targetResourceIds, testSuiteIds: [] },
            dbConnection, auth.callerOrgId
          );
          break;
        case 'hard':
          throw new Error('Hard delete not implemented yet');
        default:
          throw new Error('Received unknown test suite deletion mode');
      }

      const testSuiteIds = (
        await this.#repo.findBy(
          {
            targetResourceIds: req.targetResourceIds,
            deleted: false,
          },
          dbConnection, auth.callerOrgId
        )
      ).map((el) => el.id);

      await deleteSchedules(auth.callerOrgId, testSuiteIds);

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
