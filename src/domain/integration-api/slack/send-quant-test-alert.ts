import Result from '../../value-types/transient-types/result';
import IUseCase from '../../services/use-case';
import {
  AlertMessageConfig,
  IIntegrationApiRepo,
} from '../i-integration-api-repo';
import { SendAlertResultDto } from './send-alert-result-dto';
import { QuantTestAlertDto } from './quant-test-alert-dto';
import { appConfig } from '../../../config';

export type SendQuantSlackAlertRequestDto = {
  alertDto: QuantTestAlertDto;
  targetOrgId: string;
};

export interface SendQuantSlackAlertAuthDto {
  jwt: string;
}

export type SendQuantSlackAlertResponseDto = Result<SendAlertResultDto>;

export class SendQuantTestSlackAlert
  implements
    IUseCase<
      SendQuantSlackAlertRequestDto,
      SendQuantSlackAlertResponseDto,
      SendQuantSlackAlertAuthDto
    >
{
  readonly #integrationApiRepo: IIntegrationApiRepo;

  constructor(integrationApiRepo: IIntegrationApiRepo) {
    this.#integrationApiRepo = integrationApiRepo;
  }

  static #buildAlertMessageConfig = (
    quantAlertDto: QuantTestAlertDto
  ): AlertMessageConfig => ({
    alertId: quantAlertDto.alertId,
    testType: quantAlertDto.testType,
    occurredOn: `${quantAlertDto.detectedOn} (UTC)`,
    anomalyMessagePart: `${quantAlertDto.testType.replaceAll(
      /column|materialization/gi,
      ''
    )} Alert - ${(quantAlertDto.deviation * 100).toFixed(2)}% Deviation`,
    detectedValuePart: `*Detected Value:*\n${quantAlertDto.value} (${(
      quantAlertDto.deviation * 100
    ).toFixed(2)}% deviation)`,
    expectedRangePart: `*Expected Range:*\n${quantAlertDto.expectedLowerBound.toFixed(2)} - ${quantAlertDto.expectedUpperBound.toFixed(2)}`,
    summaryPart: quantAlertDto.message.replace(
      '__base_url__',
      appConfig.slack.callbackRoot
    ),
  });

  async execute(
    request: SendQuantSlackAlertRequestDto,
    auth: SendQuantSlackAlertAuthDto
  ): Promise<SendQuantSlackAlertResponseDto> {
    try {
      const messageConfig = SendQuantTestSlackAlert.#buildAlertMessageConfig(
        request.alertDto
      );

      const sendQuantSlackAlertResponse: SendAlertResultDto =
        await this.#integrationApiRepo.sendSlackAlert(
          messageConfig,
          request.targetOrgId,
          auth.jwt
        );

      return Result.ok(sendQuantSlackAlertResponse);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
