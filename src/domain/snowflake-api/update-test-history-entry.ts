import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';

import { TestType } from '../entities/quant-test-suite';
import { QualTestType } from '../entities/qual-test-suite';
import { QuerySnowflake } from './query-snowflake';
import { Binds, IConnectionPool } from './i-snowflake-api-repo';
import BaseAuth from '../services/base-auth';

export interface UpdateTestHistoryEntryRequestDto {
  alertId: string;
  testType: TestType | QualTestType;
  userFeedbackIsAnomaly: number;
}

export interface UpdateTestHistoryEntryAuthDto
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

export type UpdateTestHistoryEntryResponseDto = Result<string>;

export class UpdateTestHistoryEntry
  implements
    IUseCase<
      UpdateTestHistoryEntryRequestDto,
      UpdateTestHistoryEntryResponseDto,
      UpdateTestHistoryEntryAuthDto,
      IConnectionPool
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(props: {
    req: UpdateTestHistoryEntryRequestDto;
    auth: UpdateTestHistoryEntryAuthDto;
    connPool: IConnectionPool;
  }): Promise<UpdateTestHistoryEntryResponseDto> {
    try {
      const { req, connPool } = props;

      const binds: Binds = [req.userFeedbackIsAnomaly, req.alertId];

      const queryText = `
      update cito.observability.test_history
      set user_feedback_is_anomaly = ?
      where alert_id = ?;
      `;

      const querySnowflakeResult = await this.#querySnowflake.execute({
        req: { queryText, binds },
        connPool,
      });

      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);

      const result = querySnowflakeResult.value;
      if (!result) throw new Error(`"Update Test History" query failed`);

      return Result.ok(req.alertId);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
