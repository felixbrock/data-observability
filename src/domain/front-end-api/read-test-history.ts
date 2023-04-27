import { Document } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDbConnection } from '../services/i-db';

export interface ReadTestHistoryRequestDto {
    ids: string
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

  async execute(props: {
    req: ReadTestHistoryRequestDto;
    auth: ReadTestHistoryAuthDto;
    dbConnection: IDbConnection;
  }): Promise<ReadTestHistoryResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      const testSuiteIds = req.ids;
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
            preserveNullAndEmptyArrays: false
          },
        },
        {
          $lookup: {
            from: `test_results_${auth.callerOrgId}`,
            localField: 'execution_id',
            foreignField: 'execution_id',
            as: 'test_results'
          },
        },
        {
          $unwind: {
            path: '$test_results',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            test_suite_id: { $in: testSuiteIds }
          },
        },
        {
          $sort: { executed_on: -1 },
        },
        {
          $limit: 200,
        },
      ];

      const testHistoryResults = await dbConnection
      .collection(`test_history_${auth.callerOrgId}`)
      .aggregate(pipeline).toArray();

      return Result.ok(testHistoryResults);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}