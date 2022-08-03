import Result from '../../value-types/transient-types/result';
import IUseCase from '../../services/use-case';
import { IIntegrationApiRepo } from '../i-integration-api-repo';
import { SendAlertResultDto } from './send-alert-result-dto';
import { AlertDto } from './alert-dto';

export type SendSlackAlertRequestDto = AlertDto;

export interface SendSlackAlertAuthDto {
  jwt: string;
}

export type SendSlackAlertResponseDto = Result<SendAlertResultDto>;

export class SendSlackAlert
  implements
    IUseCase<
      SendSlackAlertRequestDto,
      SendSlackAlertResponseDto,
      SendSlackAlertAuthDto
    >
{
  readonly #integrationApiRepo: IIntegrationApiRepo;

  constructor(integrationApiRepo: IIntegrationApiRepo) {
    this.#integrationApiRepo = integrationApiRepo;
  }

  async execute(
    request: SendSlackAlertRequestDto,
    auth: SendSlackAlertAuthDto
  ): Promise<SendSlackAlertResponseDto> {
    console.log(auth);

    try {
      const sendSlackAlertResponse: SendAlertResultDto =
        await this.#integrationApiRepo.sendSlackAlert({...request}, auth.jwt);

      return Result.ok(sendSlackAlertResponse);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
