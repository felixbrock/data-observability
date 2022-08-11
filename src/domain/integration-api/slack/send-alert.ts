import Result from '../../value-types/transient-types/result';
import IUseCase from '../../services/use-case';
import {
  AlertMessageConfig,
  IIntegrationApiRepo,
} from '../i-integration-api-repo';
import { SendAlertResultDto } from './send-alert-result-dto';
import { AlertDto } from './alert-dto';
import { appConfig } from '../../../config';

export type SendSlackAlertRequestDto = {
  alertDto: AlertDto;
  targetOrganizationId: string;
};

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

  #buildAlertMessageConfig = (alertDto: AlertDto): AlertMessageConfig => ({
    alertId: alertDto.alertId,
    occuredOn: `${alertDto.detectedOn} (UTC)`,
    anomalyMessagePart: `Distribution alert for value of ${
      alertDto.value
    } at a deviation of ${alertDto.deviation * 100}%`,
    detectedValuePart: `*Detected Value:*\n${alertDto.value} (${
      alertDto.deviation * 100
    }% deviation)`,
    expectedRangePart: `*Expected Range:*\n${alertDto.expectedLowerBound} - ${alertDto.expectedUpperBound}`,
    summaryPart: alertDto.message.replace(
      '__base_url__',
      appConfig.slack.resourceBaseUrl
    ),
  });

  async execute(
    request: SendSlackAlertRequestDto,
    auth: SendSlackAlertAuthDto
  ): Promise<SendSlackAlertResponseDto> {
    try {
      const messageConfig = this.#buildAlertMessageConfig(request.alertDto);

      const sendSlackAlertResponse: SendAlertResultDto =
        await this.#integrationApiRepo.sendSlackAlert(
          messageConfig,
          request.targetOrganizationId,
          auth.jwt
        );

      return Result.ok(sendSlackAlertResponse);
    } catch (error: unknown) {
      if (typeof error === 'string') return Result.fail(error);
      if (error instanceof Error) return Result.fail(error.message);
      return Result.fail('Unknown error occured');
    }
  }
}
