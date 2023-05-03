import { Document } from 'mongodb';
import { IDbConnection } from '../../domain/services/i-db';

export default class AlertHistoryRepo {
  readAlertHistory = async (
    testSuiteIds: string[],
    dbConnection: IDbConnection,
    callerOrgId: string
  ): Promise<Document[]> => {
    try {
        const pipeline = [
            {
              $lookup: {
                from: `test_results_${callerOrgId}`,
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
                from: `test_executions_${callerOrgId}`,
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
        .collection(`test_alerts_${callerOrgId}`)
        .aggregate(pipeline).toArray();

        return results;
    } catch (error: unknown) {
        if (error instanceof Error) console.error(error.stack);
        else if (error) console.trace(error);
        return Promise.reject(new Error(''));
    }
  };
}