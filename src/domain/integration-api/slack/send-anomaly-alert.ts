import Result from '../../value-types/transient-types/result';
import IUseCase from '../../services/use-case';
import {
  AlertMessageConfig,
  IIntegrationApiRepo,
} from '../i-integration-api-repo';
import { SendAlertResultDto } from './send-alert-result-dto';
import { AnomalyAlertDto } from './anomaly-alert-dto';
import { appConfig } from '../../../config';

export type SendAnomalySlackAlertRequestDto = {
  alertDto: AnomalyAlertDto;
  targetOrganizationId: string;
};

export interface SendAnomalySlackAlertAuthDto {
  jwt: string;
}

export type SendAnomalySlackAlertResponseDto = Result<SendAlertResultDto>;

export class SendAnomalySlackAlert
  implements
    IUseCase<
      SendAnomalySlackAlertRequestDto,
      SendAnomalySlackAlertResponseDto,
      SendAnomalySlackAlertAuthDto
    >
{
  readonly #integrationApiRepo: IIntegrationApiRepo;

  constructor(integrationApiRepo: IIntegrationApiRepo) {
    this.#integrationApiRepo = integrationApiRepo;
  }

  #buildAlertMessageConfig = (anomalyAlertDto: AnomalyAlertDto): AlertMessageConfig => ({
    alertId: anomalyAlertDto.alertId,
    occuredOn: `${anomalyAlertDto.detectedOn} (UTC)`,
    anomalyMessagePart: `Distribution Alert - ${anomalyAlertDto.deviation * 100}% Deviation`,
    detectedValuePart: `*Detected Value:*\n${anomalyAlertDto.value} (${
      anomalyAlertDto.deviation * 100
    }% deviation)`,
    expectedRangePart: `*Expected Range:*\n${anomalyAlertDto.expectedLowerBound} - ${anomalyAlertDto.expectedUpperBound}`,
    summaryPart: anomalyAlertDto.message.replace(
      '__base_url__',
      appConfig.slack.callbackRoot
    ),
  });

  async execute(
    request: SendAnomalySlackAlertRequestDto,
    auth: SendAnomalySlackAlertAuthDto
  ): Promise<SendAnomalySlackAlertResponseDto> {
    try {
      const messageConfig = this.#buildAlertMessageConfig(request.alertDto);

      const sendAnomalySlackAlertResponse: SendAlertResultDto =
        await this.#integrationApiRepo.sendSlackAlert(
          messageConfig,
          request.targetOrganizationId,
          auth.jwt
        );

      return Result.ok(sendAnomalySlackAlertResponse);
    } catch (error: unknown) {
      if (error instanceof Error && error.message) console.trace(error.message);
      else if (!(error instanceof Error) && error) console.trace(error);
      return Result.fail('');
    }
  }
}
