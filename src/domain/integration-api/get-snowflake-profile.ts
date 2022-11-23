import Result from '../value-types/transient-types/result';
import IUseCase from '../services/use-case';
import {
  IIntegrationApiRepo,
  SnowflakeProfileDto,
} from './i-integration-api-repo';

export type GetSnowflakeProfileRequestDto = {targetOrgId?: string};

export interface GetSnowflakeProfileAuthDto {
  jwt: string;
}

export type GetSnowflakeProfileResponseDto = Result<SnowflakeProfileDto>;

export class GetSnowflakeProfile
  implements
    IUseCase<
      GetSnowflakeProfileRequestDto,
      GetSnowflakeProfileResponseDto,
      GetSnowflakeProfileAuthDto
    >
{
  readonly #integrationApiRepo: IIntegrationApiRepo;

  constructor(integrationApiRepo: IIntegrationApiRepo) {
    this.#integrationApiRepo = integrationApiRepo;
  }

  async execute(
    request: GetSnowflakeProfileRequestDto,
    auth: GetSnowflakeProfileAuthDto
  ): Promise<GetSnowflakeProfileResponseDto> {
    try {
      const getSnowflakeProfileResponse: SnowflakeProfileDto =
        await this.#integrationApiRepo.getSnowflakeProfile(
          auth.jwt,
          request.targetOrgId,
        );

      return Result.ok(getSnowflakeProfileResponse);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.error(error.stack);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
