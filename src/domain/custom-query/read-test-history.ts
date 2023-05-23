import { Document } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDbConnection } from '../services/i-db';
import CustomQueryRepo from '../../infrastructure/persistence/custom-query-repo';

export interface ReadTestHistoryRequestDto {
  testSuiteIds: string[];
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
  readonly #repo: CustomQueryRepo;

  constructor(customQueryRepo: CustomQueryRepo) {
    this.#repo = customQueryRepo;
  }

  async execute(props: {
    req: ReadTestHistoryRequestDto;
    auth: ReadTestHistoryAuthDto;
    dbConnection: IDbConnection;
  }): Promise<ReadTestHistoryResponseDto> {
    const { req, auth, dbConnection } = props;

    const pipeline = [
      {
        $lookup: {
          from: `test_executions_${auth.callerOrgId}`,
          localField: 'execution_id',
          foreignField: 'id',
          as: 'test_executions',
        },
      },
      {
        $unwind: {
          path: '$test_executions',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: `test_results_${auth.callerOrgId}`,
          localField: 'execution_id',
          foreignField: 'execution_id',
          as: 'test_results',
        },
      },
      {
        $unwind: {
          path: '$test_results',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          test_suite_id: { $in: req.testSuiteIds },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$test_results', '$$ROOT'],
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$test_executions', '$$ROOT'],
          },
        },
      },
      {
        $sort: { executed_on: -1 },
      },
      {
        $limit: 200,
      },
    ];

    try {
      const results = await this.#repo.readTestHistory(
        pipeline,
        auth.callerOrgId,
        dbConnection
      );

      return Result.ok(results);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
