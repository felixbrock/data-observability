import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { TestType } from '../entities/quant-test-suite';
import { QuerySnowflake } from './query-snowflake';
import { IConnectionPool } from './i-snowflake-api-repo';
import BaseAuth from '../services/base-auth';
import { IDbConnection } from '../services/i-db';

export type ThresholdType = 'lower' | 'upper';

export interface PostAnomalyFeedbackRequestDto {
  alertId: string;
  testType: TestType;
  userFeedbackIsAnomaly: number;
  detectedValue: number;
  thresholdType: ThresholdType;
  testSuiteId?: string;
}

export interface PostAnomalyFeedbackAuthDto
  extends Omit<BaseAuth, 'callerOrgId'> {
  callerOrgId: string;
}

const citoMaterializationNames = [
  'test_suites',
  'test_history',
  'test_results',
  'test_executions',
  'test_alerts',
  'test_suites_qual',
  'test_history_qual',
  'test_results_qual',
  'test_executions_qual',
  'test_alerts_qual',
  'test_suites_custom',
] as const;
type CitoMaterializationName = typeof citoMaterializationNames[number];

export const parseCitoMaterializationName = (
  citoMaterializationName: unknown
): CitoMaterializationName => {
  const identifiedElement = citoMaterializationNames.find(
    (element) => element === citoMaterializationName
  );
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

export type PostAnomalyFeedbackResponseDto = Result<string>;

export class PostAnomalyFeedback
  implements
    IUseCase<
      PostAnomalyFeedbackRequestDto,
      PostAnomalyFeedbackResponseDto,
      PostAnomalyFeedbackAuthDto,
      IConnectionPool
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  #updateTestSuite = async (
    detectedValue: number,
    thresholdType: ThresholdType,
    testSuiteId: string,
    dbConnection: IDbConnection,
    callerOrgId: string
  ): Promise<void> => {
    console.log(
      `Updating anomaly feedback threshold for test suite ${testSuiteId}`
    );

    try {
      const result = await dbConnection
      .collection(`test_suites_${callerOrgId}`)
      .updateOne(
        { id: testSuiteId },
        { $set: { [`feedback_${thresholdType}_threshold`]: detectedValue } }
      );

      if (result.matchedCount === 0) {
        throw new Error(`"Update Test History" query failed`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
    }
  };

  #updateTestHistory = async (
    userFeedbackIsAnomaly: number,
    alertId: string,
    dbConnection: IDbConnection,
    callerOrgId: string
  ): Promise<void> => {
    console.log(`Updating test history based on alert ${alertId}`);
    
    try {
      const result = await dbConnection
      .collection(`test_history_${callerOrgId}`)
      .updateOne(
        { alert_id: alertId },
        { $set: { user_feedback_is_anomaly: userFeedbackIsAnomaly } }
      );

      if (result.matchedCount === 0) {
        throw new Error(`"Update Test History" query failed`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
    }
  };

  async execute(props: {
    req: PostAnomalyFeedbackRequestDto;
    auth: PostAnomalyFeedbackAuthDto;
    dbConnection: IDbConnection;
  }): Promise<PostAnomalyFeedbackResponseDto> {
    try {
      const { req, auth, dbConnection } = props;

      if (
        req.userFeedbackIsAnomaly === 0 &&
        !(req.detectedValue && req.thresholdType && req.testSuiteId)
      )
        throw new Error(
          'Feedback indicates false-positive but thresholdType, detectedValue and/or test suite id are missing. Cannot perform operation.'
        );

      await this.#updateTestHistory(
        req.userFeedbackIsAnomaly,
        req.alertId,
        dbConnection,
        auth.callerOrgId
      );

      if (
        req.userFeedbackIsAnomaly === 0 &&
        req.detectedValue &&
        req.thresholdType &&
        req.testSuiteId
      )
        await this.#updateTestSuite(
          req.detectedValue,
          req.thresholdType,
          req.testSuiteId,
          dbConnection,
          auth.callerOrgId
        );

      return Result.ok(req.alertId);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
