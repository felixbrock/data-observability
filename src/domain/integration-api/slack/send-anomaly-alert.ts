import Result from '../../value-types/transient-types/result';
import IUseCase from '../../services/use-case';
import {
  AlertMessageConfig,
  IIntegrationApiRepo,
} from '../i-integration-api-repo';
import { SendAlertResultDto } from './send-alert-result-dto';
import { QuantitativeAlertDto } from './quantitative-alert-dto';
import { appConfig } from '../../../config';

export type SendQuantitativeSlackAlertRequestDto = {
  alertDto: QuantitativeAlertDto;
  targetOrgId: string;
};

export interface SendQuantitativeSlackAlertAuthDto {
  jwt: string;
}

export type SendQuantitativeSlackAlertResponseDto = Result<SendAlertResultDto>;

export class SendQuantitativeSlackAlert
  implements
    IUseCase<
      SendQuantitativeSlackAlertRequestDto,
      SendQuantitativeSlackAlertResponseDto,
      SendQuantitativeSlackAlertAuthDto
    >
{
  readonly #integrationApiRepo: IIntegrationApiRepo;

  constructor(integrationApiRepo: IIntegrationApiRepo) {
    this.#integrationApiRepo = integrationApiRepo;
  }

  static #buildAlertMessageConfig = (
    quantitativeAlertDto: QuantitativeAlertDto
  ): AlertMessageConfig => ({
    alertId: quantitativeAlertDto.alertId,
    testType: quantitativeAlertDto.testType,
    occurredOn: `${quantitativeAlertDto.detectedOn} (UTC)`,
    quantitativeMessagePart: `${quantitativeAlertDto.testType.replaceAll(
      /column|materialization/gi,
      ''
    )} Alert - ${(quantitativeAlertDto.deviation * 100).toFixed(2)}% Deviation`,
    detectedValuePart: `*Detected Value:*\n${quantitativeAlertDto.value} (${(
      quantitativeAlertDto.deviation * 100
    ).toFixed(2)}% deviation)`,
    expectedRangePart: `*Expected Range:*\n${quantitativeAlertDto.expectedLowerBound.toFixed(2)} - ${quantitativeAlertDto.expectedUpperBound.toFixed(2)}`,
    summaryPart: quantitativeAlertDto.message.replace(
      '__base_url__',
      appConfig.slack.callbackRoot
    ),
  });

  async execute(
    request: SendQuantitativeSlackAlertRequestDto,
    auth: SendQuantitativeSlackAlertAuthDto
  ): Promise<SendQuantitativeSlackAlertResponseDto> {
    try {
      const messageConfig = SendQuantitativeSlackAlert.#buildAlertMessageConfig(
        request.alertDto
      );

      const sendQuantitativeSlackAlertResponse: SendAlertResultDto =
        await this.#integrationApiRepo.sendSlackAlert(
          messageConfig,
          request.targetOrgId,
          auth.jwt
        );

      return Result.ok(sendQuantitativeSlackAlertResponse);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
