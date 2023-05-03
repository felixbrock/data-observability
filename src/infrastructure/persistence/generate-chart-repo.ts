import { Document } from 'mongodb';
import { IDbConnection } from '../../domain/services/i-db';

export default class GenerateChartRepo {
    readTestHistory = async (
        testSuiteId: string,
        dbConnection: IDbConnection,
        callerOrgId: string
    ): Promise<Document[]> => {
        try {
            const pipeline = [
                {
                  $lookup: {
                    from: `test_executions_${callerOrgId}`,
                    localField: 'execution_id',
                    foreignField: 'id',
                    as: 'test_executions'
                  }
                },
                {
                  $unwind: {
                    path: '$test_executions',
                    preserveNullAndEmptyArrays: false
                  }
                },
                {
                  $lookup: {
                    from: `test_results_${callerOrgId}`,
                    localField: 'execution_id',
                    foreignField: 'execution_id',
                    as: 'test_results'
                  }
                },
                {
                  $unwind: {
                    path: '$test_results',
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                  $match: {
                    test_suite_id: testSuiteId
                  }
                },
                {
                  $project: {
                    test_suite_id: 1,
                    value: 1,
                    executed_on: '$test_executions.executed_on',
                    value_upper_bound: '$test_results.expected_value_upper_bound',
                    value_lower_bound: '$test_results.expected_value_lower_bound',
                    is_anomaly: 1,
                    user_feedback_is_anomaly: 1
                  }
                },
                {
                  $sort: {
                    'execution_id': -1
                  }
                },
                {
                  $limit: 200
                }
            ];
        
            const queryResult = await dbConnection
            .collection(`test_history_${callerOrgId}`)
            .aggregate(pipeline).toArray();
        
            return queryResult;
        } catch (error: unknown) {
            if (error instanceof Error) console.error(error.stack);
            else if (error) console.trace(error);
            return Promise.reject(new Error(''));
        }
    }
}