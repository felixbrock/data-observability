import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import { TestType } from '../entities/quant-test-suite';
import { QuerySnowflake } from './query-snowflake';
import { Binds, IConnectionPool } from './i-snowflake-api-repo';
import BaseAuth from '../services/base-auth';

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
    connPool: IConnectionPool
  ): Promise<void> => {
    console.log(
      `Updating anomaly feedback threshold for test suite ${testSuiteId}`
    );

    const binds: Binds = [detectedValue, testSuiteId];

    const queryText = `
  update cito.observability.test_suites
  set feedback_${thresholdType}_threshold = ?,
  where id = ?;
  `;

    try {
      const querySnowflakeResult = await this.#querySnowflake.execute({
        req: { queryText, binds },
        connPool,
      });

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      const result = querySnowflakeResult.value;
      if (!result) throw new Error(`"Update Test History" query failed`);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
    }
  };

  #updateTestHistory = async (
    userFeedbackIsAnomaly: number,
    alertId: string,
    connPool: IConnectionPool
  ): Promise<void> => {
    console.log(`Updating test history based on alert ${alertId}`);

    const binds: Binds = [userFeedbackIsAnomaly, alertId];

    const queryText = `
  update cito.observability.test_history
  set user_feedback_is_anomaly = ?
  where alert_id = ?;
  `;

    try {
      const querySnowflakeResult = await this.#querySnowflake.execute({
        req: { queryText, binds },
        connPool,
      });

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      const result = querySnowflakeResult.value;
      if (!result) throw new Error(`"Update Test History" query failed`);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
    }
  };

  async execute(props: {
    req: PostAnomalyFeedbackRequestDto;
    auth: PostAnomalyFeedbackAuthDto;
    connPool: IConnectionPool;
  }): Promise<PostAnomalyFeedbackResponseDto> {
    try {
      const { req, connPool } = props;

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
        connPool
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
          connPool
        );

      return Result.ok(req.alertId);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
