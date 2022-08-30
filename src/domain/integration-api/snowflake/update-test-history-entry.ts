import IUseCase from '../../services/use-case';
import Result from '../../value-types/transient-types/result';
import { QuerySnowflake } from './query-snowflake';
import CitoDataQuery from '../../services/cito-data-query';

export interface UpdateTestHistoryEntryRequestDto {
  id: string;
  userFeedbackIsAnomaly: number;
}

export interface UpdateTestHistoryEntryAuthDto {
  jwt: string;
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
      const updateQuery = CitoDataQuery.getUpdateTestHistoryEntryQuery(request.id, request.userFeedbackIsAnomaly);

      const updateResult = await this.#querySnowflake.execute(
        { query: updateQuery },
        { jwt: auth.jwt }
      );

      if (!updateResult.success) throw new Error(updateResult.error);

      if (!updateResult.value)
        throw new Error(`Updating testHistoryEntry ${request.id} failed`);

      // if (testHistoryEntry.organizationId !== auth.organizationId)
      //   throw new Error('Not authorized to perform action');

      return Result.ok(request.id);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}