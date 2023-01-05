import Result from '../../value-types/transient-types/result';
import IUseCase from '../../services/use-case';
import {
  AlertMessageConfig,
  IIntegrationApiRepo,
} from '../i-integration-api-repo';
import { SendAlertResultDto } from './send-alert-result-dto';
import { QualitativeTestAlertDto } from './qualitative-test-alert-dto';
import { appConfig } from '../../../config';

export type SendQualitativeTestSlackAlertRequestDto = {
  alertDto: QualitativeTestAlertDto;
  targetOrgId: string;
};

export interface SendQualitativeTestSlackAlertAuthDto {
  jwt: string;
}

export type SendQualitativeTestSlackAlertResponseDto = Result<SendAlertResultDto>;

export class SendQualitativeTestSlackAlert
  implements
    IUseCase<
      SendQualitativeTestSlackAlertRequestDto,
      SendQualitativeTestSlackAlertResponseDto,
      SendQualitativeTestSlackAlertAuthDto
    >
{
  readonly #integrationApiRepo: IIntegrationApiRepo;

  constructor(integrationApiRepo: IIntegrationApiRepo) {
    this.#integrationApiRepo = integrationApiRepo;
  }

  #buildAlertMessageConfig = (
    alertDto: QualitativeTestAlertDto
  ): AlertMessageConfig => ({
    alertId: alertDto.alertId,
    testType: alertDto.testType,
    occurredOn: `${alertDto.detectedOn} (UTC)`,
    anomalyMessagePart: `Schema Change Alert`,
    detectedValuePart: `*Detected Schema Change:*\n${alertDto.schemaDiffs}`,
    expectedRangePart: ``,
    summaryPart: alertDto.message.replace(
      '__base_url__',
      appConfig.slack.callbackRoot
    ),
  });

  async execute(
    request: SendQualitativeTestSlackAlertRequestDto,
    auth: SendQualitativeTestSlackAlertAuthDto
  ): Promise<SendQualitativeTestSlackAlertResponseDto> {
    try {
      const messageConfig = this.#buildAlertMessageConfig(request.alertDto);

      const sendSlackAlertResponse: SendAlertResultDto =
        await this.#integrationApiRepo.sendSlackAlert(
          messageConfig,
          request.targetOrgId,
          auth.jwt
        );

      return Result.ok(sendSlackAlertResponse);
    } catch (error: unknown) {
      if (error instanceof Error ) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
