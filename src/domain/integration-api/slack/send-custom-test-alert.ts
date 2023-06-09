import Result from '../../value-types/transient-types/result';
import IUseCase from '../../services/use-case';
import {
  IIntegrationApiRepo,
  QuantAlertMsgConfig,
} from '../i-integration-api-repo';
import { SendAlertResultDto } from './send-alert-result-dto';
import { appConfig } from '../../../config';
import { CustomTestAlertDto } from './custom-test-alert-dto';

export type SendCustomSlackAlertRequestDto = {
  alertDto: CustomTestAlertDto;
  targetOrgId: string;
};

export interface SendCustomSlackAlertAuthDto {
  jwt: string;
}

export type SendCustomSlackAlertResponseDto = Result<SendAlertResultDto>;

export class SendCustomTestSlackAlert
  implements
    IUseCase<
      SendCustomSlackAlertRequestDto,
      SendCustomSlackAlertResponseDto,
      SendCustomSlackAlertAuthDto
    >
{
  readonly #integrationApiRepo: IIntegrationApiRepo;

  constructor(integrationApiRepo: IIntegrationApiRepo) {
    this.#integrationApiRepo = integrationApiRepo;
  }

  static #buildHeader = (testName: string, deviation: string): string =>
    `${testName} Alert: ${deviation}% Deviation`;

  static #buildAlertMessageConfig = (
    customAlertDto: CustomTestAlertDto
  ): QuantAlertMsgConfig => ({
    alertId: customAlertDto.alertId,
    testType: customAlertDto.testType,
    occurredOn: `${customAlertDto.detectedOn} (UTC)`,
    anomalyMessagePart: this.#buildHeader(
      customAlertDto.name,
      customAlertDto.deviation
    ),
    detectedValuePart: `*Detected Value:*\n${customAlertDto.detectedValue} (${customAlertDto.deviation}% deviation)`,
    expectedRangePart: `*Expected Range:*\n${customAlertDto.expectedLowerBound} : ${customAlertDto.expectedUpperBound}`,
    summaryPart: customAlertDto.message.replace(
      '__base_url__',
      appConfig.slack.callbackRoot
    ),
    imageUrl: customAlertDto.chartUrl,
    detectedValue: customAlertDto.detectedValue,
    thresholdType: customAlertDto.thresholdType,
    testSuiteId: customAlertDto.testSuiteId,
  });

  async execute(props: {
    req: SendCustomSlackAlertRequestDto;
    auth: SendCustomSlackAlertAuthDto;
  }): Promise<SendCustomSlackAlertResponseDto> {
    const { req, auth } = props;

    try {
      const messageConfig = SendCustomTestSlackAlert.#buildAlertMessageConfig(
        req.alertDto
      );

      const sendCustomSlackAlertResponse: SendAlertResultDto =
        await this.#integrationApiRepo.sendQuantSlackAlert(
          messageConfig,
          req.targetOrgId,
          auth.jwt
        );

      return Result.ok(sendCustomSlackAlertResponse);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}