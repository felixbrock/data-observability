import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';

import { columnTestTypes, matTestTypes, TestType } from '../entities/test-suite';
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
      const binds: Binds = [req.alertId, req.userFeedbackIsAnomaly];
 
      const tableName: CitoMaterializationName =
      req.testType in columnTestTypes || req.testType in matTestTypes
        ? 'test_history'
        : 'test_history_nominal';

      const queryText = `
      update cito.observability.${tableName}
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
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
