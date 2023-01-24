import Result from '../../value-types/transient-types/result';
import IUseCase from '../../services/use-case';
import {
  IIntegrationApiRepo,
  QualAlertMsgConfig,
} from '../i-integration-api-repo';
import { SendAlertResultDto } from './send-alert-result-dto';
import { QualTestAlertDto } from './qual-test-alert-dto';
import { appConfig } from '../../../config';

export type SendQualTestSlackAlertRequestDto = {
  alertDto: QualTestAlertDto;
  targetOrgId: string;
};

export interface SendQualTestSlackAlertAuthDto {
  jwt: string;
}

export type SendQualTestSlackAlertResponseDto = Result<SendAlertResultDto>;

export class SendQualTestSlackAlert
  implements
    IUseCase<
      SendQualTestSlackAlertRequestDto,
      SendQualTestSlackAlertResponseDto,
      SendQualTestSlackAlertAuthDto
    >
{
  readonly #integrationApiRepo: IIntegrationApiRepo;

  constructor(integrationApiRepo: IIntegrationApiRepo) {
    this.#integrationApiRepo = integrationApiRepo;
  }

  #buildAlertMessageConfig = (
    alertDto: QualTestAlertDto
  ): QualAlertMsgConfig => ({
    alertId: alertDto.alertId,
    testType: alertDto.testType,
    occurredOn: `${alertDto.detectedOn} (UTC)`,
    anomalyMessagePart: `Schema Change Alert`,
    detectedValuePart: `*Detected Schema Change:*\n${alertDto.deviations}`,
    summaryPart: alertDto.message.replace(
      '__base_url__',
      appConfig.slack.callbackRoot
    ),
  });

  async execute(props: {
    req: SendQualTestSlackAlertRequestDto;
    auth: SendQualTestSlackAlertAuthDto;
  }): Promise<SendQualTestSlackAlertResponseDto> {
    const { req, auth } = props;

    try {
      const messageConfig = this.#buildAlertMessageConfig(req.alertDto);

      const sendSlackAlertResponse: SendAlertResultDto =
        await this.#integrationApiRepo.sendQualSlackAlert(
          messageConfig,
          req.targetOrgId,
          auth.jwt
        );

      return Result.ok(sendSlackAlertResponse);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
