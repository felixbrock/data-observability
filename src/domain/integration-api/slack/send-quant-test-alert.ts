import Result from '../../value-types/transient-types/result';
import IUseCase from '../../services/use-case';
import {
  IIntegrationApiRepo,
  QuantAlertMsgConfig,
} from '../i-integration-api-repo';
import { SendAlertResultDto } from './send-alert-result-dto';
import { QuantTestAlertDto } from './quant-test-alert-dto';
import { appConfig } from '../../../config';
import { TestType } from '../../entities/quant-test-suite';

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

  static #buildHeader = (testType: TestType, deviation: string): string => {
    const colRegex = /column/gi;
    const prefix = colRegex.test(testType)
      ? testType.replace(colRegex, 'Col. ')
      : testType.replace(/materialization/gi, 'Mat. ');

    return `${prefix} Alert: ${deviation}% Deviation`;
  };

  static #buildAlertMessageConfig = (
    quantAlertDto: QuantTestAlertDto
  ): QuantAlertMsgConfig => {
    return {
      alertId: quantAlertDto.alertId,
      testType: quantAlertDto.testType,
      occurredOn: `${quantAlertDto.detectedOn} (UTC)`,
      anomalyMessagePart: this.#buildHeader(
        quantAlertDto.testType,
        quantAlertDto.deviation
      ),
      detectedValuePart: `*Detected Value:*\n${quantAlertDto.detectedValue} (${quantAlertDto.deviation}% deviation)`,
      expectedRangePart: `*Expected Range:*\n${quantAlertDto.expectedLowerBound} : ${quantAlertDto.expectedUpperBound}`,
      summaryPart: quantAlertDto.message.replace(
        '__base_url__',
        appConfig.slack.callbackRoot
      ),
      imageUrl: quantAlertDto.chartUrl,
      detectedValue: quantAlertDto.detectedValue,
      thresholdType: quantAlertDto.thresholdType,
      testSuiteId: quantAlertDto.testSuiteId,
    };
  };

  async execute(props: {
    req: SendQuantSlackAlertRequestDto;
    auth: SendQuantSlackAlertAuthDto;
  }): Promise<SendQuantSlackAlertResponseDto> {
    const { req, auth } = props;

    try {
      const messageConfig = SendQuantTestSlackAlert.#buildAlertMessageConfig(
        req.alertDto
      );

      const sendQuantSlackAlertResponse: SendAlertResultDto =
        await this.#integrationApiRepo.sendQuantSlackAlert(
          messageConfig,
          req.targetOrgId,
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
