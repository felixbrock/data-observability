import IUseCase from '../services/use-case';
import Result from '../value-types/transient-types/result';
import CitoDataQuery from '../services/cito-data-query';
import { TestType } from '../entities/test-suite';
import { NominalTestType } from '../entities/nominal-test-suite';
import { QuerySnowflake } from './query-snowflake';
import { SnowflakeProfileDto } from '../integration-api/i-integration-api-repo';

export interface UpdateTestHistoryEntryRequestDto {
  alertId: string;
  testType: TestType | NominalTestType;
  userFeedbackIsAnomaly: number;
  profile: SnowflakeProfileDto;
}

export interface UpdateTestHistoryEntryAuthDto {
  jwt: string;
  isSystemInternal: boolean;
  callerOrgId: string;
}

export type UpdateTestHistoryEntryResponseDto = Result<string>;

export class UpdateTestHistoryEntry
  implements
    IUseCase<
      UpdateTestHistoryEntryRequestDto,
      UpdateTestHistoryEntryResponseDto,
      UpdateTestHistoryEntryAuthDto
    >
{
  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  async execute(
    request: UpdateTestHistoryEntryRequestDto,
    auth: UpdateTestHistoryEntryAuthDto
  ): Promise<UpdateTestHistoryEntryResponseDto> {
    try {
      const updateQueryText = CitoDataQuery.getUpdateTestHistoryEntryQuery(
        request.alertId,
        request.testType,
        request.userFeedbackIsAnomaly
      );

      const updateResult = await this.#querySnowflake.execute(
        { queryText: updateQueryText, binds: [], profile: request.profile },
        auth
      );

      if (!updateResult.success) throw new Error(updateResult.error);

      if (!updateResult.value)
        throw new Error(`Updating testHistoryEntry ${request.alertId} failed`);

      // if (testHistoryEntry.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(request.alertId);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
