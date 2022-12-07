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
  targetOrgId: string;
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

  static #buildAlertMessageConfig = (
    anomalyAlertDto: AnomalyAlertDto
  ): AlertMessageConfig => ({
    alertId: anomalyAlertDto.alertId,
    testType: anomalyAlertDto.testType,
    occuredOn: `${anomalyAlertDto.detectedOn} (UTC)`,
    anomalyMessagePart: `${anomalyAlertDto.testType.replaceAll(
      /column|materialization/gi,
      ''
    )} Alert - ${(anomalyAlertDto.deviation * 100).toFixed(2)}% Deviation`,
    detectedValuePart: `*Detected Value:*\n${anomalyAlertDto.value} (${(
      anomalyAlertDto.deviation * 100
    ).toFixed(2)}% deviation)`,
    expectedRangePart: `*Expected Range:*\n${anomalyAlertDto.expectedLowerBound.toFixed(2)} - ${anomalyAlertDto.expectedUpperBound.toFixed(2)}`,
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
      const messageConfig = SendAnomalySlackAlert.#buildAlertMessageConfig(
        request.alertDto
      );

      const sendAnomalySlackAlertResponse: SendAlertResultDto =
        await this.#integrationApiRepo.sendSlackAlert(
          messageConfig,
          request.targetOrgId,
          auth.jwt
        );

      return Result.ok(sendAnomalySlackAlertResponse);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
