import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';

import { TestType } from '../entities/test-suite';
import { NominalTestType } from '../entities/nominal-test-suite';
import { QuerySnowflake } from './query-snowflake';
import { Binds, IConnectionPool } from './i-snowflake-api-repo';
import BaseAuth from '../services/base-auth';

export interface UpdateTestHistoryEntryRequestDto {
  alertId: string;
  testType: TestType | NominalTestType;
  userFeedbackIsAnomaly: number;
}

export interface UpdateTestHistoryEntryAuthDto extends Omit<BaseAuth, 'callerOrgId'>  {
  callerOrgId: string;
}

const citoMaterializationNames = [
  'test_suites',
  'test_history',
  'test_results',
  'test_executions',
  'test_alerts',
  'test_suites_nominal',
  'test_history_nominal',
  'test_results_nominal',
  'test_executions_nominal',
  'test_alerts_nominal',
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

  async execute(
    req: UpdateTestHistoryEntryRequestDto,
    auth: UpdateTestHistoryEntryAuthDto, connPool: IConnectionPool
  ): Promise<UpdateTestHistoryEntryResponseDto> {
    try {
      const binds: Binds = [req.userFeedbackIsAnomaly, req.alertId];
 
      const queryText = `
      update cito.observability.test_history
      set user_feedback_is_anomaly = ?
      where alert_id = ?;
      `;
      
      const querySnowflakeResult = await this.#querySnowflake.execute(
        { queryText, binds },
        auth,
        connPool
      );
  
      if (!querySnowflakeResult.success)
        throw new Error(querySnowflakeResult.error);
  
      const result = querySnowflakeResult.value;
      if (!result) throw new Error(`"Update Test History" query failed`);
  
      return Result.ok(req.alertId);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
