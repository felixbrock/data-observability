import { Document } from 'mongodb';
import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import { IDbConnection } from '../services/i-db';

export interface ReadTestAlertsRequestDto {
    ids: string[]
}

export type ReadTestAlertsAuthDto = {
  callerOrgId: string;
};

export type ReadTestAlertsResponseDto = Result<Document[] | null>;

export class ReadTestAlerts
  implements
    IUseCase<
      ReadTestAlertsRequestDto,
      ReadTestAlertsResponseDto,
      ReadTestAlertsAuthDto,
      IDbConnection
    >
{

  async execute(props: {
    req: ReadTestAlertsRequestDto;
    auth: ReadTestAlertsAuthDto;
    dbConnection: IDbConnection;
  }): Promise<ReadTestAlertsResponseDto> {
    const { req, auth, dbConnection } = props;

    try {
      const testSuiteIds = req.ids;
      const pipeline = [
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
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $lookup: {
              from: `test_executions_${auth.callerOrgId}`,
              localField: 'execution_id',
              foreignField: 'id',
              as: 'test_executions'
            },
          },
          {
            $unwind: {
              path: '$test_executions',
              preserveNullAndEmptyArrays: false,
            },
          },
          {
            $match: {
              test_suite_id: { $in: testSuiteIds }
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: ['$test_results', '$$ROOT']
              }
            }
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: ['$test_executions', '$$ROOT']
              }
            }
          },
          {
            $project: {
              test_suite_id: 1,
              deviation: 1,
              executed_on: 1
            },
          },
          {
            $sort: { 
              'executed_on': -1 
            },
          },
          {
            $limit: 200
          }
      ];

      const results = await dbConnection
      .collection(`test_alerts_${auth.callerOrgId}`)
      .aggregate(pipeline).toArray();

      return Result.ok(results);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}