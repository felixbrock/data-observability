import Result from '../../value-types/transient-types/result';
import IUseCase from '../../services/use-case';
import { IIntegrationApiRepo } from '../i-integration-api-repo';
import { SnowflakeQueryResultDto } from './snowlake-query-result-dto';

export interface QuerySnowflakeRequestDto {
  query: string;
}

export interface QuerySnowflakeAuthDto {
  jwt: string;
}

export type QuerySnowflakeResponseDto = Result<SnowflakeQueryResultDto>;

export class QuerySnowflake
  implements
    IUseCase<
      QuerySnowflakeRequestDto,
      QuerySnowflakeResponseDto,
      QuerySnowflakeAuthDto
    >
{
  readonly #integrationApiRepo: IIntegrationApiRepo;

  constructor(integrationApiRepo: IIntegrationApiRepo) {
    this.#integrationApiRepo = integrationApiRepo;
  }

  async execute(
    request: QuerySnowflakeRequestDto,
    auth: QuerySnowflakeAuthDto
  ): Promise<QuerySnowflakeResponseDto> {
    console.log(auth);

    try {
      const querySnowflakeResponse: SnowflakeQueryResultDto =
        await this.#integrationApiRepo.querySnowflake(request.query, auth.jwt);

      return Result.ok(querySnowflakeResponse);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
